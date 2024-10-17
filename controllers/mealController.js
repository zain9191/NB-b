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
    // Parse JSON fields if they are strings
    if (typeof req.body.nutritionalInfo === 'string') {
      try {
        req.body.nutritionalInfo = JSON.parse(req.body.nutritionalInfo);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON format in nutritionalInfo.',
        });
      }
    }

    if (typeof req.body.contactInformation === 'string') {
      try {
        req.body.contactInformation = JSON.parse(req.body.contactInformation);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON format in contactInformation.',
        });
      }
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

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON format in nutritionalInfo or contactInformation.',
      });
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
     if (typeof req.body.nutritionalInfo === 'string') {
      req.body.nutritionalInfo = JSON.parse(req.body.nutritionalInfo);
    }
    if (typeof req.body.contactInformation === 'string') {
      req.body.contactInformation = JSON.parse(req.body.contactInformation);
    }

    // Validate request body
    const { error, value } = mealSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const {
      name,
      description,
      price,
      ingredients,
      category,
      cuisine,
      portionSize,
      nutritionalInfo,
      dietaryRestrictions,
      expirationDate,
      pickupDeliveryOptions,
      preparationDate,
      packagingInformation,
      healthSafetyCompliance,
      contactInformation,
      paymentOptions,
      preparationMethod,
      cookingInstructions,
      additionalNotes,
      tags,
      sellerRating,
      quantityAvailable,
      discountsPromotions,
       addressId,
    } = value;

    // Find the meal to update
    let meal = await Meal.findOne({ _id: mealId, createdBy: userId });
    if (!meal) {
      return res.status(404).json({ success: false, msg: 'Meal not found.' });
    }

    // Update meal fields
    meal.name = name;
    meal.description = description;
    meal.price = price;
    meal.ingredients = ingredients.split(',').map(item => item.trim());
    meal.category = category;
    meal.cuisine = cuisine;
    meal.portionSize = portionSize;
    meal.nutritionalInfo = nutritionalInfo;
    meal.dietaryRestrictions = dietaryRestrictions ? dietaryRestrictions.split(',').map(item => item.trim()) : [];
    meal.expirationDate = new Date(expirationDate);
    meal.pickupDeliveryOptions = pickupDeliveryOptions.split(',').map(item => item.trim());
    meal.preparationDate = new Date(preparationDate);
    meal.packagingInformation = packagingInformation;
    meal.healthSafetyCompliance = healthSafetyCompliance;
    meal.contactInformation = contactInformation;
    meal.paymentOptions = paymentOptions.split(',').map(item => item.trim());
    meal.preparationMethod = preparationMethod;
    meal.cookingInstructions = cookingInstructions;
    meal.additionalNotes = additionalNotes;
    meal.tags = tags ? tags.split(',').map(item => item.trim()) : [];
    meal.sellerRating = sellerRating;
    meal.quantityAvailable = quantityAvailable;
    meal.discountsPromotions = discountsPromotions ? discountsPromotions.split(',').map(item => item.trim()) : [];

    // Handle address update if addressId is provided
    if (addressId) {
      const address = await Address.findOne({ _id: addressId, userId: userId, isDeleted: false });
      if (!address) {
        return res.status(400).json({ success: false, error: 'Invalid address ID.' });
      }
      meal.address = addressId;
      meal.location = {
        type: 'Point',
        coordinates: [address.location.coordinates[0], address.location.coordinates[1]],
      };
    }

    // Handle image uploads if any
    if (req.files && req.files.length > 0) {
      // Optionally delete old images from filesystem
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
      // Assign new image paths
      meal.images = req.files.map(file => file.path);
    }

    // Save the updated meal
    await meal.save();

    res.status(200).json({ success: true, data: meal });
  } catch (error) {
    logger.error(`Error updating meal: ${error.message}`, { stack: error.stack });
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
// controllers/mealController.js

exports.getFilterOptions = async (req, res) => {
  try {
    const categories = await Meal.distinct('category');
    const cuisines = await Meal.distinct('cuisine');

    // For array fields, use aggregation pipeline
    const dietaryRestrictionsResult = await Meal.aggregate([
      { $unwind: '$dietaryRestrictions' },
      { $group: { _id: null, values: { $addToSet: '$dietaryRestrictions' } } }
    ]);

    const dietaryRestrictions = dietaryRestrictionsResult[0]?.values || [];

    const pickupDeliveryOptionsResult = await Meal.aggregate([
      { $unwind: '$pickupDeliveryOptions' },
      { $group: { _id: null, values: { $addToSet: '$pickupDeliveryOptions' } } }
    ]);

    const pickupDeliveryOptions = pickupDeliveryOptionsResult[0]?.values || [];

    const paymentOptionsResult = await Meal.aggregate([
      { $unwind: '$paymentOptions' },
      { $group: { _id: null, values: { $addToSet: '$paymentOptions' } } }
    ]);

    const paymentOptions = paymentOptionsResult[0]?.values || [];

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
    console.error(`Error fetching filter options: ${error.message}`);
    console.error(error); // This will log the full error object
    logger.error(`Error fetching filter options: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to fetch filter options' });
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
