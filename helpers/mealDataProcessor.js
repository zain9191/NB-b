
const processMealData = (data) => {
    const processField = (field) => {
      if (!field) return [];
      return Array.isArray(field)
        ? field
        : field.split(',').map((item) => item.trim()).filter((item) => item);
    };
  
     const processedData = {
      ...data,
      ingredients: processField(data.ingredients),
      tags: processField(data.tags),
      dietaryRestrictions: processField(data.dietaryRestrictions),
      pickupDeliveryOptions: processField(data.pickupDeliveryOptions),
      paymentOptions: processField(data.paymentOptions),
      discountsPromotions: processField(data.discountsPromotions),
    };
  
     if (data.nutritionalInfo) {
      processedData.nutritionalInfo = {
        calories: data.nutritionalInfo.calories || 0,
        protein: data.nutritionalInfo.protein || 0,
        fat: data.nutritionalInfo.fat || 0,
        carbs: data.nutritionalInfo.carbs || 0,
        vitamins: processField(data.nutritionalInfo.vitamins),
      };
    }
  
     if (data.contactInformation) {
      processedData.contactInformation = {
        email: data.contactInformation.email || '',
        phone: data.contactInformation.phone || '',
      };
    }
  
    return processedData;
  };
  
  module.exports = { processMealData };
  