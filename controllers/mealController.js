// controllers/mealController.js

const Meal = require('../models/Meal');
const User = require('../models/User');
const Address = require('../models/Address');
const fs = require('fs'); // Required for handling image deletions

/**
 * Utility function to process fields that can be either strings or arrays.
 * @param {string | Array} field - The field to process.
 * @returns {Array} - An array of trimmed strings.
 */
const processField = (field) => {
  if (typeof field === 'string') {
    return field
      .split(',')
      .map(item => item.trim())
      .filter(item => item); // Removes empty strings
  } else if (Array.isArray(field)) {
    return field
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(item => item);
  } else {
    return []; // Default to empty array if field is neither string nor array
  }
};

/**
 * Utility function to update an existing address with new data.
 * @param {Object} existingAddress - The existing Address document.
 * @param {Object} newAddressData - The new address data to update.
 */
const updateExistingAddress = async (existingAddress, newAddressData) => {
  existingAddress.street = newAddressData.street || existingAddress.street;
  existingAddress.city = newAddressData.city || existingAddress.city;
  existingAddress.state = newAddressData.state || existingAddress.state;
  existingAddress.postalCode = newAddressData.postalCode || existingAddress.postalCode;
  existingAddress.country = newAddressData.country || existingAddress.country;
  existingAddress.location.coordinates = newAddressData.coordinates || existingAddress.location.coordinates;

  await existingAddress.save();
};

/**
 * Create a new meal
 */
exports.createMeal = async (req, res) => {
  try {
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
      addressId, // Receive addressId from request body
    } = req.body;

    let address;
    if (addressId) {
      // Find the address by addressId and ensure it belongs to the user
      address = await Address.findOne({ _id: addressId, user_id: req.user._id });
      if (!address) {
        return res.status(404).json({ success: false, error: 'Address not found.' });
      }
    } else {
      // Fetch the user's active address
      const user = await User.findById(req.user._id).populate('activeAddress');
      if (!user || !user.activeAddress) {
        return res.status(400).json({ success: false, error: 'Active address not set for user.' });
      }
      address = user.activeAddress;
    }

    // Create the meal using the selected or active address
    const meal = new Meal({
      name,
      description,
      price,
      ingredients: Array.isArray(ingredients) ? ingredients : ingredients.split(',').map(item => item.trim()),
      category,
      cuisine,
      portionSize,
      nutritionalInfo: nutritionalInfo ? JSON.parse(nutritionalInfo) : {},
      dietaryRestrictions: dietaryRestrictions ? (Array.isArray(dietaryRestrictions) ? dietaryRestrictions : dietaryRestrictions.split(',').map(item => item.trim())) : [],
      expirationDate,
      pickupDeliveryOptions: pickupDeliveryOptions ? (Array.isArray(pickupDeliveryOptions) ? pickupDeliveryOptions : pickupDeliveryOptions.split(',').map(item => item.trim())) : [],
      preparationDate,
      packagingInformation,
      healthSafetyCompliance,
      contactInformation: contactInformation ? JSON.parse(contactInformation) : {},
      paymentOptions: paymentOptions ? (Array.isArray(paymentOptions) ? paymentOptions : paymentOptions.split(',').map(item => item.trim())) : [],
      preparationMethod,
      cookingInstructions,
      additionalNotes,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(item => item.trim())) : [],
      sellerRating: sellerRating ? parseFloat(sellerRating) : 0,
      quantityAvailable: quantityAvailable ? parseInt(quantityAvailable, 10) : 0,
      discountsPromotions: discountsPromotions ? discountsPromotions.split(',').map(item => item.trim()) : [],
      images: req.files.map((file) => file.path),
      createdBy: req.user._id,
      address: address._id, // Associate with the selected address
    });

    await meal.save();

    res.status(201).json({ success: true, data: meal });
  } catch (error) {
    console.error("Error creating meal:", error);
    res.status(500).json({ success: false, error: "Failed to create meal." });
  }
};

/**
 * Update an existing meal
 */
exports.updateMeal = async (req, res, next) => {
  const mealId = req.params.id;
  const userId = req.user._id;

  try {
    const meal = await Meal.findById(mealId);

    if (!meal) {
      return res.status(404).json({ success: false, msg: 'Meal not found' });
    }

    if (meal.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, msg: 'You are not authorized to edit this meal' });
    }

    // Prevent updating the 'createdBy' field
    if (req.body.createdBy) {
      delete req.body.createdBy;
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
      addressId, // Receive addressId from request body
    } = req.body;

    let address;
    if (addressId) {
      // Find the new address by addressId and ensure it belongs to the user
      address = await Address.findOne({ _id: addressId, user_id: userId });
      if (!address) {
        return res.status(404).json({ success: false, error: 'Address not found.' });
      }
    } else {
      // Retain the existing address
      address = await Address.findById(meal.address);
      if (!address) {
        return res.status(404).json({ success: false, msg: 'Associated address not found.' });
      }
    }

    // Prepare update data
    const updatedData = {
      name: name || meal.name,
      description: description || meal.description,
      price: price !== undefined ? price : meal.price,
      ingredients: ingredients
        ? Array.isArray(ingredients)
          ? ingredients
          : ingredients.split(',').map(item => item.trim())
        : meal.ingredients,
      category: category || meal.category,
      cuisine: cuisine || meal.cuisine,
      portionSize: portionSize || meal.portionSize,
      nutritionalInfo: nutritionalInfo
        ? JSON.parse(nutritionalInfo)
        : meal.nutritionalInfo,
      dietaryRestrictions: dietaryRestrictions
        ? Array.isArray(dietaryRestrictions)
          ? dietaryRestrictions
          : dietaryRestrictions.split(',').map(item => item.trim())
        : meal.dietaryRestrictions,
      expirationDate: expirationDate || meal.expirationDate,
      pickupDeliveryOptions: pickupDeliveryOptions
        ? Array.isArray(pickupDeliveryOptions)
          ? pickupDeliveryOptions
          : pickupDeliveryOptions.split(',').map(item => item.trim())
        : meal.pickupDeliveryOptions,
      preparationDate: preparationDate || meal.preparationDate,
      packagingInformation: packagingInformation || meal.packagingInformation,
      healthSafetyCompliance: healthSafetyCompliance || meal.healthSafetyCompliance,
      contactInformation: contactInformation
        ? JSON.parse(contactInformation)
        : meal.contactInformation,
      paymentOptions: paymentOptions
        ? Array.isArray(paymentOptions)
          ? paymentOptions
          : paymentOptions.split(',').map(item => item.trim())
        : meal.paymentOptions,
      preparationMethod: preparationMethod || meal.preparationMethod,
      cookingInstructions: cookingInstructions || meal.cookingInstructions,
      additionalNotes: additionalNotes || meal.additionalNotes,
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(',').map(item => item.trim())
        : meal.tags,
      sellerRating:
        sellerRating !== undefined ? parseFloat(sellerRating) : meal.sellerRating,
      quantityAvailable:
        quantityAvailable !== undefined
          ? parseInt(quantityAvailable, 10)
          : meal.quantityAvailable,
      discountsPromotions: discountsPromotions
        ? discountsPromotions.split(',').map(item => item.trim())
        : meal.discountsPromotions,
      address: address._id, // Update address association
    };

    // Handle images if new images are uploaded
    if (req.files && req.files.length > 0) {
      // Delete old images from the filesystem to prevent orphaned files
      meal.images.forEach((imgPath) => {
        fs.unlink(imgPath, (err) => {
          if (err) console.error(`Failed to delete image ${imgPath}:`, err);
        });
      });
      updatedData.images = req.files.map((file) => file.path);
    }

    // Update the meal
    const updatedMeal = await Meal.findByIdAndUpdate(
      mealId,
      { $set: updatedData },
      { new: true }
    )
      .populate("createdBy", "full_name email")
      .populate("address");

    res.json({ success: true, data: updatedMeal });
  } catch (err) {
    console.error('Error updating meal:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

/**
 * Get meals with filtering and geospatial search
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
      // Removed lat, lng, and address
      ...otherFilters
    } = req.query;

    let query = {};

    // Search by meal name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by cuisine
    if (cuisine) {
      query.cuisine = cuisine;
    }

    // Filter by dietary restrictions
    if (dietaryRestrictions) {
      query.dietaryRestrictions = dietaryRestrictions;
    }

    // Filter by pickup/delivery options
    if (pickupDeliveryOptions) {
      query.pickupDeliveryOptions = pickupDeliveryOptions;
    }

    // Filter by prepared by (chef's name)
    if (preparedBy) {
      const users = await User.find({
        full_name: { $regex: preparedBy, $options: "i" },
      });
      const userIds = users.map((user) => user._id);
      query.createdBy = { $in: userIds };
    }

    // Filter by address components (city, state, postalCode)
    if (city || state || postalCode) {
      query = {
        ...query,
        'address': {
          $exists: true,
        },
      };
    }

    // Apply any additional filters from otherFilters
    Object.keys(otherFilters).forEach(key => {
      query[key] = otherFilters[key];
    });

    const meals = await Meal.find(query)
      .populate({
        path: 'address',
        match: {
          ...(city && { city: new RegExp(city, 'i') }),
          ...(state && { state: new RegExp(state, 'i') }),
          ...(postalCode && { postalCode: new RegExp(postalCode, 'i') }),
        },
      })
      .populate('createdBy', 'full_name email');

    // Filter out meals where the address didn't match the populated criteria
    const filteredMeals = meals.filter(meal => meal.address);

    res.json(filteredMeals);
  } catch (err) {
    console.error('Error fetching meals:', err);
    next(err);
  }
};

/**
 * Get a meal by its ID
 */
exports.getMealById = async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.id)
      .populate('createdBy', 'full_name email')
      .populate('address'); // Ensure address is populated

    if (!meal) {
      return res.status(404).json({ success: false, msg: 'Meal not found' });
    }
    res.json({ success: true, data: meal });
  } catch (err) {
    console.error('Error fetching meal by ID:', err);
    next(err);
  }
};


/**
 * Get meals created by the authenticated user
 */
exports.getUserMeals = async (req, res, next) => {
  try {
    const meals = await Meal.find({ createdBy: req.user._id })
      .populate("createdBy", "full_name email")
      .populate('address'); // Populate address data

    res.json({ success: true, data: meals });
  } catch (err) {
    console.error('Error fetching user meals:', err);
    next(err);
  }
};

/**
 * Get filter options for categories, cuisines, etc.
 */
exports.getFilterOptions = async (req, res, next) => {
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
  } catch (err) {
    console.error('Error fetching filter options:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch filter options' });
  }
};

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
          console.error(`Failed to delete image ${imgPath}:`, err);
        }
      });
    });

    res.json({ success: true, msg: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};