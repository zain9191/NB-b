// controllers/mealController.js

const Meal = require('../models/Meal');
const User = require('../models/User');
const Address = require('../models/Address');
const fs = require('fs'); // For handling image deletions
const Joi = require('joi');
const winston = require('winston');

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
// Joi Validation Schema
// ============================

const mealSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().min(1).required(),
  price: Joi.number().min(0).required(),
  ingredients: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().min(1)),
    Joi.string().trim().min(1)
  ).required(),
  category: Joi.string().min(1).max(100).required(),
  cuisine: Joi.string().min(1).max(100).required(),
  portionSize: Joi.string().min(1).max(100).required(),
  nutritionalInfo: Joi.object({
    calories: Joi.number().min(0),
    protein: Joi.number().min(0),
    fat: Joi.number().min(0),
    carbs: Joi.number().min(0),
    vitamins: Joi.alternatives().try(
      Joi.array().items(Joi.string().trim().min(1)),
      Joi.string().trim().min(1)
    ).optional(),
  }).optional(),
  dietaryRestrictions: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().min(1)),
    Joi.string().trim().min(1)
  ).optional(),
  expirationDate: Joi.date().required(),
  pickupDeliveryOptions: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().min(1)),
    Joi.string().trim().min(1)
  ).required(),
  preparationDate: Joi.date().required(),
  packagingInformation: Joi.string().allow(''),
  healthSafetyCompliance: Joi.string().allow(''),
  contactInformation: Joi.object({
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).message('Please enter a valid phone number.'),
  }).optional(),
  paymentOptions: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().min(1)),
    Joi.string().trim().min(1)
  ).required(),
  preparationMethod: Joi.string().allow(''),
  cookingInstructions: Joi.string().allow(''),
  additionalNotes: Joi.string().allow(''),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().min(1)),
    Joi.string().trim().min(1)
  ).required(),
  sellerRating: Joi.number().min(1).max(5).optional(),
  quantityAvailable: Joi.number().min(1).required(),
  discountsPromotions: Joi.alternatives().try(
    Joi.array().items(Joi.string().trim().min(1)),
    Joi.string().trim().min(1)
  ).optional(),
  addressId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
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

    let address;
    if (addressId) {
      // Find the address by addressId and ensure it belongs to the user and is not deleted
      address = await Address.findOne({ _id: addressId, user_id: req.user._id, isDeleted: false });
      if (!address) {
        return res.status(404).json({ success: false, error: 'Address not found or has been deleted.' });
      }
    } else {
      // Fetch the user's active address
      const user = await User.findById(req.user._id).populate('activeAddress');
      if (!user || !user.activeAddress) {
        return res.status(400).json({ success: false, error: 'Active address not set for user.' });
      }
      address = user.activeAddress;
    }

    // Process fields that can be arrays or comma-separated strings
    const processedIngredients = Array.isArray(ingredients)
      ? ingredients
      : ingredients.split(',').map(item => item.trim()).filter(item => item);

    const processedTags = Array.isArray(tags)
      ? tags
      : tags.split(',').map(item => item.trim()).filter(item => item);

    const processedDietaryRestrictions = dietaryRestrictions
      ? (Array.isArray(dietaryRestrictions)
          ? dietaryRestrictions
          : dietaryRestrictions.split(',').map(item => item.trim()).filter(item => item))
      : [];

    const processedPickupDeliveryOptions = Array.isArray(pickupDeliveryOptions)
      ? pickupDeliveryOptions
      : pickupDeliveryOptions.split(',').map(item => item.trim()).filter(item => item);

    const processedPaymentOptions = Array.isArray(paymentOptions)
      ? paymentOptions
      : paymentOptions.split(',').map(item => item.trim()).filter(item => item);

    const processedDiscountsPromotions = discountsPromotions
      ? (Array.isArray(discountsPromotions)
          ? discountsPromotions
          : discountsPromotions.split(',').map(item => item.trim()).filter(item => item))
      : [];

    // Parse nutritionalInfo and contactInformation if they are strings
    const parsedNutritionalInfo = nutritionalInfo
      ? {
          calories: nutritionalInfo.calories || 0,
          protein: nutritionalInfo.protein || 0,
          fat: nutritionalInfo.fat || 0,
          carbs: nutritionalInfo.carbs || 0,
          vitamins: nutritionalInfo.vitamins
            ? Array.isArray(nutritionalInfo.vitamins)
              ? nutritionalInfo.vitamins
              : nutritionalInfo.vitamins.split(',').map(item => item.trim()).filter(item => item)
            : [],
        }
      : {};

    const parsedContactInformation = contactInformation
      ? {
          email: contactInformation.email || '',
          phone: contactInformation.phone || '',
        }
      : {};

    // Create the meal instance
    const meal = new Meal({
      name,
      description,
      price,
      ingredients: processedIngredients,
      category,
      cuisine,
      portionSize,
      nutritionalInfo: parsedNutritionalInfo,
      dietaryRestrictions: processedDietaryRestrictions,
      expirationDate,
      pickupDeliveryOptions: processedPickupDeliveryOptions,
      preparationDate,
      packagingInformation,
      healthSafetyCompliance,
      contactInformation: parsedContactInformation,
      paymentOptions: processedPaymentOptions,
      preparationMethod,
      cookingInstructions,
      additionalNotes,
      tags: processedTags,
      sellerRating: sellerRating ? parseFloat(sellerRating) : 0,
      quantityAvailable: parseInt(quantityAvailable, 10),
      discountsPromotions: processedDiscountsPromotions,
      images: req.files.map((file) => file.path),
      createdBy: req.user._id,
      address: address._id,
    });

    await meal.save();

    // Respond with the newly created meal
    res.status(201).json({ success: true, data: meal });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ success: false, message: 'The meal is already registered.' });
    }
    logger.error(`Error creating meal: ${error.message}`, { stack: error.stack });
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
      return res.status(403).json({ success: false, msg: 'You are not authorized to edit this meal' });
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

    let address;
    if (addressId) {
      // Find the new address by addressId and ensure it belongs to the user and is not deleted
      address = await Address.findOne({ _id: addressId, user_id: userId, isDeleted: false });
      if (!address) {
        return res.status(404).json({ success: false, error: 'Address not found or has been deleted.' });
      }
    } else {
      // Retain the existing address
      address = await Address.findById(meal.address);
      if (!address) {
        return res.status(404).json({ success: false, msg: 'Associated address not found.' });
      }
    }

    // Process fields that can be arrays or comma-separated strings
    const processedIngredients = Array.isArray(ingredients)
      ? ingredients
      : ingredients.split(',').map(item => item.trim()).filter(item => item);

    const processedTags = Array.isArray(tags)
      ? tags
      : tags.split(',').map(item => item.trim()).filter(item => item);

    const processedDietaryRestrictions = dietaryRestrictions
      ? (Array.isArray(dietaryRestrictions)
          ? dietaryRestrictions
          : dietaryRestrictions.split(',').map(item => item.trim()).filter(item => item))
      : [];

    const processedPickupDeliveryOptions = Array.isArray(pickupDeliveryOptions)
      ? pickupDeliveryOptions
      : pickupDeliveryOptions.split(',').map(item => item.trim()).filter(item => item);

    const processedPaymentOptions = Array.isArray(paymentOptions)
      ? paymentOptions
      : paymentOptions.split(',').map(item => item.trim()).filter(item => item);

    const processedDiscountsPromotions = discountsPromotions
      ? (Array.isArray(discountsPromotions)
          ? discountsPromotions
          : discountsPromotions.split(',').map(item => item.trim()).filter(item => item))
      : [];

    // Parse nutritionalInfo and contactInformation if they are strings
    const parsedNutritionalInfo = nutritionalInfo
      ? {
          calories: nutritionalInfo.calories || 0,
          protein: nutritionalInfo.protein || 0,
          fat: nutritionalInfo.fat || 0,
          carbs: nutritionalInfo.carbs || 0,
          vitamins: nutritionalInfo.vitamins
            ? Array.isArray(nutritionalInfo.vitamins)
              ? nutritionalInfo.vitamins
              : nutritionalInfo.vitamins.split(',').map(item => item.trim()).filter(item => item)
            : [],
        }
      : {};

    const parsedContactInformation = contactInformation
      ? {
          email: contactInformation.email || '',
          phone: contactInformation.phone || '',
        }
      : {};

    // Prepare update data
    const updatedData = {
      name: name || meal.name,
      description: description || meal.description,
      price: price !== undefined ? price : meal.price,
      ingredients: processedIngredients,
      category: category || meal.category,
      cuisine: cuisine || meal.cuisine,
      portionSize: portionSize || meal.portionSize,
      nutritionalInfo: parsedNutritionalInfo,
      dietaryRestrictions: processedDietaryRestrictions,
      expirationDate: expirationDate || meal.expirationDate,
      pickupDeliveryOptions: processedPickupDeliveryOptions,
      preparationDate: preparationDate || meal.preparationDate,
      packagingInformation,
      healthSafetyCompliance,
      contactInformation: parsedContactInformation,
      paymentOptions: processedPaymentOptions,
      preparationMethod: preparationMethod || meal.preparationMethod,
      cookingInstructions: cookingInstructions || meal.cookingInstructions,
      additionalNotes: additionalNotes || meal.additionalNotes,
      tags: processedTags,
      sellerRating: sellerRating ? parseFloat(sellerRating) : meal.sellerRating,
      quantityAvailable: parseInt(quantityAvailable, 10),
      discountsPromotions: processedDiscountsPromotions,
      address: address._id,
    };

    // Handle images if new images are uploaded
    if (req.files && req.files.length > 0) {
      // Delete old images from the filesystem to prevent orphaned files
      meal.images.forEach((imgPath) => {
        fs.unlink(imgPath, (err) => {
          if (err) logger.error(`Failed to delete image ${imgPath}: ${err.message}`);
        });
      });
      updatedData.images = req.files.map((file) => file.path);
    }

    // Update the meal in the database
    const updatedMeal = await Meal.findByIdAndUpdate(
      mealId,
      { $set: updatedData },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "full_name email")
      .populate("address");

    res.json({ success: true, data: updatedMeal });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ success: false, message: 'The updated meal conflicts with an existing meal.' });
    }
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
        : dietaryRestrictions.split(',').map(item => item.trim()).filter(item => item);
      matchConditions.dietaryRestrictions = { $all: dietaryArray };
    }

    if (pickupDeliveryOptions) {
      const pickupArray = Array.isArray(pickupDeliveryOptions)
        ? pickupDeliveryOptions
        : pickupDeliveryOptions.split(',').map(item => item.trim()).filter(item => item);
      matchConditions.pickupDeliveryOptions = { $all: pickupArray };
    }

    if (preparedBy) {
      const users = await User.find({
        full_name: { $regex: preparedBy, $options: 'i' },
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
      const radiusInRadians = parseFloat(radius) / 6378137; // Earth's radius in meters

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

      const addressIds = addressesWithinRadius.map(address => address._id);

      // Add addressIds to matchConditions
      matchConditions.address = { $in: addressIds };
    } else if (city || state || postalCode) {
      let addressMatch = {};
      if (city) addressMatch.city = { $regex: new RegExp(city, 'i') };
      if (state) addressMatch.state = { $regex: new RegExp(state, 'i') };
      if (postalCode) addressMatch.postalCode = { $regex: new RegExp(postalCode, 'i') };

      // Find addresses matching the criteria
      const addresses = await Address.find(addressMatch).select('_id');
      const addressIds = addresses.map(address => address._id);

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
          full_name: '$createdByDetails.full_name',
          email: '$createdByDetails.email',
        },
        address: '$addressDetails',
      },
    });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Execute aggregation
    const meals = await Meal.aggregate(pipeline);

    // Get total count for pagination
    const totalPipeline = [...pipeline];
    // Remove pagination stages
    totalPipeline.pop(); // $limit
    totalPipeline.pop(); // $skip
    // Add a count stage
    totalPipeline.push({
      $count: 'total',
    });
    const totalResult = await Meal.aggregate(totalPipeline);
    const total = totalResult[0] ? totalResult[0].total : 0;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: meals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
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
      .populate('createdBy', 'full_name email _id') // Include _id for user identification
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
      .populate("createdBy", "full_name email")
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
    meal.images.forEach((imgPath) => {
      fs.unlink(imgPath, (err) => {
        if (err) {
          logger.error(`Failed to delete image ${imgPath}: ${err.message}`);
        }
      });
    });

    res.json({ success: true, msg: 'Meal deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting meal: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
