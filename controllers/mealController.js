// controllers/mealController.js

const Meal = require('../models/Meal');
const User = require('../models/User');
const Address = require('../models/Address');
const fs = require('fs').promises; // Use promises for file operations
const winston = require('winston');

// Import helper functions
const { processMealData } = require('../helpers/mealDataProcessor');
const { getAddress } = require('../helpers/addressHelper');

// Import validation schema
const mealSchema = require('../validation/mealSchema');

// Configure Winston logger (if not already configured globally)
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
    // Add more transports (e.g., Console) if needed
  ],
});

// ============================
// Controller Functions
// ============================

/**
 * Create a new meal
 */
exports.createMeal = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = mealSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }

    // Process meal data
    const processedData = processMealData(value);

    // Get address
    const address = await getAddress(value.addressId, req.user._id);

    // Create the meal instance
    const meal = new Meal({
      ...processedData,
      images: req.files ? req.files.map((file) => file.path) : [],
      createdBy: req.user._id,
      address: address._id,
    });

    await meal.save();

    // Respond with the newly created meal
    res.status(201).json({ success: true, data: meal });
  } catch (error) {
    logger.error(`Error creating meal: ${error.message}`, { stack: error.stack });
    if (
      error.message.includes('Address not found') ||
      error.message.includes('Active address not set')
    ) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Update an existing meal
 */
exports.updateMeal = async (req, res) => {
  const mealId = req.params.id;
  const userId = req.user._id;

  try {
    // Find the meal by ID
    const meal = await Meal.findById(mealId);
    if (!meal) {
      return res.status(404).json({ success: false, msg: 'Meal not found' });
    }

    // Check if the authenticated user is the creator of the meal
    if (meal.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ success: false, msg: 'You are not authorized to edit this meal' });
    }

    // Validate request body
    const { error, value } = mealSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }

    // Process meal data
    const processedData = processMealData(value);

    // Get address
    const address = await getAddress(value.addressId, userId, meal.address);

    // Prepare update data
    const updatedData = {
      ...processedData,
      address: address._id,
    };

    // Handle images if new images are uploaded
    if (req.files && req.files.length > 0) {
      if (meal.images && meal.images.length > 0) {
        // Delete old images from the filesystem to prevent orphaned files
        for (const imgPath of meal.images) {
          try {
            await fs.unlink(imgPath);
          } catch (err) {
            if (err.code !== 'ENOENT') {
              logger.error(`Failed to delete image ${imgPath}: ${err.message}`);
            }
          }
        }
      }
      updatedData.images = req.files.map((file) => file.path);
    }

    // Update the meal in the database
    const updatedMeal = await Meal.findByIdAndUpdate(
      mealId,
      { $set: updatedData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'fullName email')
      .populate('address');

    res.json({ success: true, data: updatedMeal });
  } catch (error) {
    logger.error(`Error updating meal: ${error.message}`, { stack: error.stack });
    if (
      error.message.includes('Address not found') ||
      error.message.includes('Associated address not found')
    ) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get all meals with filtering and pagination
 */
exports.getMeals = async (req, res, next) => {
  try {
    const {
      search,
      cuisine,
      dietaryRestrictions,
      pickupDeliveryOptions,
      preparedBy,
      city,
      state,
      postalCode,
      lat,
      lng,
      radius,
      page = 1,
      limit = 10,
      ...otherFilters
    } = req.query;

    let matchConditions = {};

    // Build matchConditions based on filters
    if (search) {
      matchConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (cuisine) {
      matchConditions.cuisine = cuisine;
    }

    if (dietaryRestrictions) {
      const dietaryArray = Array.isArray(dietaryRestrictions)
        ? dietaryRestrictions
        : dietaryRestrictions.split(',').map((item) => item.trim()).filter((item) => item);
      matchConditions.dietaryRestrictions = { $all: dietaryArray };
    }

    if (pickupDeliveryOptions) {
      const pickupArray = Array.isArray(pickupDeliveryOptions)
        ? pickupDeliveryOptions
        : pickupDeliveryOptions.split(',').map((item) => item.trim()).filter((item) => item);
      matchConditions.pickupDeliveryOptions = { $all: pickupArray };
    }

    if (preparedBy) {
      const users = await User.find({
        fullName: { $regex: preparedBy, $options: 'i' },
      }).select('_id');
      const userIds = users.map((user) => user._id);
      matchConditions.createdBy = { $in: userIds };
    }

    // Additional filters from otherFilters
    Object.keys(otherFilters).forEach((key) => {
      matchConditions[key] = otherFilters[key];
    });

    // Geospatial filtering
    if (lat && lng && radius) {
      const radiusInRadians = parseFloat(radius) / 6371000; // Correct Earth radius in meters

      // Find addresses within the radius
      const addressesWithinRadius = await Address.find({
        location: {
          $geoWithin: {
            $centerSphere: [
              [parseFloat(lng), parseFloat(lat)],
              radiusInRadians,
            ],
          },
        },
      }).select('_id');

      const addressIds = addressesWithinRadius.map((address) => address._id);

      // Add addressIds to matchConditions
      matchConditions.address = { $in: addressIds };
    } else if (city || state || postalCode) {
      let addressMatch = {};
      if (city) addressMatch.city = { $regex: new RegExp(city, 'i') };
      if (state) addressMatch.state = { $regex: new RegExp(state, 'i') };
      if (postalCode) addressMatch.postalCode = { $regex: new RegExp(postalCode, 'i') };

      // Find addresses matching the criteria
      const addresses = await Address.find(addressMatch).select('_id');
      const addressIds = addresses.map((address) => address._id);

      if (addressIds.length > 0) {
        matchConditions.address = { $in: addressIds };
      } else {
        // No addresses match, so return empty result
        return res.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0,
          },
        });
      }
    }

    // Initialize aggregation pipeline
    let pipeline = [];

    // Apply matchConditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Lookup Address details
    pipeline.push({
      $lookup: {
        from: 'addresses',
        localField: 'address',
        foreignField: '_id',
        as: 'addressDetails',
      },
    });

    // Unwind the addressDetails array
    pipeline.push({ $unwind: '$addressDetails' });

    // Lookup createdBy details
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdByDetails',
      },
    });

    pipeline.push({ $unwind: '$createdByDetails' });

    // Project desired fields
    pipeline.push({
      $project: {
        name: 1,
        description: 1,
        price: 1,
        ingredients: 1,
        category: 1,
        cuisine: 1,
        portionSize: 1,
        nutritionalInfo: 1,
        dietaryRestrictions: 1,
        expirationDate: 1,
        pickupDeliveryOptions: 1,
        preparationDate: 1,
        packagingInformation: 1,
        healthSafetyCompliance: 1,
        contactInformation: 1,
        paymentOptions: 1,
        preparationMethod: 1,
        cookingInstructions: 1,
        additionalNotes: 1,
        tags: 1,
        sellerRating: 1,
        quantityAvailable: 1,
        discountsPromotions: 1,
        images: 1,
        createdBy: {
          _id: '$createdByDetails._id',
          fullName: '$createdByDetails.fullName',
          email: '$createdByDetails.email',
        },
        address: '$addressDetails',
      },
    });

    // Pagination
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    // Add $facet stage for pagination and total count
    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: parsedLimit }],
        totalCount: [{ $count: 'count' }],
      },
    });

    // Execute aggregation pipeline
    const result = await Meal.aggregate(pipeline);

    const meals = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / parsedLimit);

    res.json({
      success: true,
      data: meals,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
      },
    });
  } catch (error) {
    logger.error(`Error fetching meals: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get a meal by its ID
 */
exports.getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id)
      .populate('createdBy', 'fullName email _id') // Include _id for user identification
      .populate({
        path: 'address',
        select: 'formattedAddress location', // Select necessary address fields
      })
      .exec();

    if (!meal) {
      return res.status(404).json({ success: false, msg: 'Meal not found' });
    }

    res.json({ success: true, data: meal });
  } catch (error) {
    logger.error(`Error fetching meal by ID: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get all meals created by the authenticated user
 */
exports.getUserMeals = async (req, res) => {
  try {
    const meals = await Meal.find({ createdBy: req.user._id })
      .populate('createdBy', 'fullName email')
      .populate('address')
      .exec();

    res.json({ success: true, data: meals });
  } catch (error) {
    logger.error(`Error fetching user meals: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * Get filter options for categories, cuisines, etc.
 */
exports.getFilterOptions = async (req, res) => {
  try {
    const categories = await Meal.distinct('category');
    const cuisines = await Meal.distinct('cuisine');
    const dietaryRestrictions = await Meal.distinct('dietaryRestrictions');
    const pickupDeliveryOptions = await Meal.distinct('pickupDeliveryOptions');
    const paymentOptions = await Meal.distinct('paymentOptions');

    res.json({
      success: true,
      data: {
        categories,
        cuisines,
        dietaryRestrictions,
        pickupDeliveryOptions,
        paymentOptions,
      },
    });
  } catch (error) {
    logger.error(`Error fetching filter options: ${error.message}`, { stack: error.stack });
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch filter options' });
  }
};

/**
 * Delete a meal (Hard Delete)
 */
exports.deleteMeal = async (req, res) => {
  const mealId = req.params.id;
  const userId = req.user._id;

  try {
    const meal = await Meal.findOneAndDelete({ _id: mealId, createdBy: userId });

    if (!meal) {
      return res.status(404).json({ success: false, msg: 'Meal not found' });
    }

    // Delete associated images from the filesystem
    if (meal.images && meal.images.length > 0) {
      for (const imgPath of meal.images) {
        try {
          await fs.unlink(imgPath);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            logger.error(`Failed to delete image ${imgPath}: ${err.message}`);
          }
        }
      }
    }

    res.json({ success: true, msg: 'Meal deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting meal: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
