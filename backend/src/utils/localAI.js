/**
 * Local AI fallback — generates meaningful responses based on
 * user carbon data without requiring the Gemini API.
 * Used when GEMINI_API_KEY is missing or invalid.
 */

const getChatResponse = (message, carbonData) => {
  const msg = message.toLowerCase();
  const total = carbonData?.totalEmission || 0;
  const transport = carbonData?.transportEmission || 0;
  const electricity = carbonData?.electricityEmission || 0;
  const food = carbonData?.foodEmission || 0;
  const lifestyle = carbonData?.lifestyleEmission || 0;

  // Find biggest emission source
  const sources = [
    { name: 'transport', value: transport, icon: '🚗' },
    { name: 'electricity', value: electricity, icon: '⚡' },
    { name: 'food', value: food, icon: '🍽️' },
    { name: 'lifestyle', value: lifestyle, icon: '🛍️' },
  ].sort((a, b) => b.value - a.value);
  const biggest = sources[0];

  // Contextual responses based on keywords
  if (msg.includes('reduce') || msg.includes('lower') || msg.includes('decrease') || msg.includes('footprint')) {
    return `Great question! ${total > 0 ? `Your current footprint is ${total.toFixed(1)} kg CO₂/month. ` : ''}Here are your top 3 actions:\n\n• 🚗 **Transport (${transport.toFixed(1)} kg):** Switch to public transport or cycling 2-3 days/week — saves ~15-20 kg CO₂/month\n• ⚡ **Electricity (${electricity.toFixed(1)} kg):** Turn off standby devices and switch to LED bulbs — saves ~10-15% on your bill\n• 🍽️ **Food (${food.toFixed(1)} kg):** Try meat-free Mondays — a vegetarian diet saves ~50 kg CO₂/month vs meat-heavy\n\n${biggest ? `Your biggest source is **${biggest.name}** at ${biggest.value.toFixed(1)} kg — focus there first for maximum impact!` : ''}`;
  }

  if (msg.includes('electricity') || msg.includes('energy') || msg.includes('power')) {
    return `⚡ **Electricity Saving Tips:**\n\n• Switch all bulbs to LED (80% less energy)\n• Unplug chargers and devices when not in use\n• Use appliances during off-peak hours (night)\n• Set AC/heater 2°C closer to outdoor temp\n• Wash clothes in cold water\n• Use a smart power strip\n\n${electricity > 0 ? `Your current electricity emission is **${electricity.toFixed(1)} kg CO₂/month**. Reducing usage by 20% would save ~${(electricity * 0.2).toFixed(1)} kg CO₂/month!` : 'Track your electricity usage in the calculator to get personalized savings.'}`;
  }

  if (msg.includes('transport') || msg.includes('car') || msg.includes('travel') || msg.includes('commute')) {
    return `🚗 **Transport Reduction Strategies:**\n\n• 🚌 Use public transport 3 days/week → saves ~30% transport emissions\n• 🚲 Cycle or walk for trips under 5 km\n• 🚗 Carpool with colleagues — split emissions by 2-4x\n• 🏠 Work from home when possible\n• ✈️ Replace one flight with train travel\n• 🔋 Consider electric vehicle next upgrade\n\n${transport > 0 ? `Your transport emissions are **${transport.toFixed(1)} kg CO₂/month** — switching to public transport twice weekly could reduce this by ~${(transport * 0.25).toFixed(1)} kg!` : ''}`;
  }

  if (msg.includes('diet') || msg.includes('food') || msg.includes('eat') || msg.includes('vegetarian') || msg.includes('vegan') || msg.includes('meat')) {
    return `🍽️ **Food & Diet Impact:**\n\n• 🥗 Going vegetarian saves ~50 kg CO₂/month vs meat-heavy diet\n• 🌱 Going vegan saves ~65 kg CO₂/month\n• 🥩 Even reducing red meat to 2x/week makes a big difference\n• 🛒 Buy local and seasonal produce\n• 🍱 Reduce food waste — 30% of food emissions come from waste\n• 🌾 Choose organic when possible\n\n${food > 0 ? `Your food emissions are **${food.toFixed(1)} kg CO₂/month**. Switching to a vegetarian diet could reduce this by up to 40%!` : ''}`;
  }

  if (msg.includes('plastic') || msg.includes('shopping') || msg.includes('lifestyle') || msg.includes('waste')) {
    return `🛍️ **Lifestyle & Plastic Reduction:**\n\n• 🛍️ Use reusable bags, bottles and containers\n• ♻️ Recycle paper, plastic, glass and metal\n• 🛒 Buy second-hand clothing and electronics\n• 📦 Avoid over-packaged products\n• 🌿 Choose products with eco-friendly packaging\n• 🔧 Repair items instead of replacing\n\n${lifestyle > 0 ? `Your lifestyle emissions are **${lifestyle.toFixed(1)} kg CO₂/month**. Simple swaps like reusable bags could cut this by ~${(lifestyle * 0.3).toFixed(1)} kg!` : ''}`;
  }

  if (msg.includes('offset') || msg.includes('tree') || msg.includes('plant') || msg.includes('carbon neutral')) {
    return `🌳 **Carbon Offset Options:**\n\n• **Plant trees:** Each tree absorbs ~21 kg CO₂/year. Plant 10 trees to offset ~210 kg/year\n• **Gold Standard offsets:** Buy verified carbon credits at ~$10-15 per tonne\n• **Renewable energy certificates:** Support solar/wind projects\n• **Contribute to reforestation:** WWF, Trees for the Future, One Tree Planted\n• **Community projects:** Local recycling, urban gardens\n\n${total > 0 ? `To offset your ${total.toFixed(1)} kg/month footprint, you'd need to plant ~${Math.ceil((total * 12) / 21)} trees per year or purchase ${(total * 12 / 1000).toFixed(2)} carbon credits.` : ''}`;
  }

  if (msg.includes('score') || msg.includes('sustainability') || msg.includes('rating')) {
    const score = carbonData?.sustainabilityScore || 0;
    const level = score >= 80 ? 'Excellent 🏆' : score >= 60 ? 'Good ✅' : score >= 40 ? 'Average ⚠️' : 'Needs Improvement 🔴';
    return `📊 **Your Sustainability Score: ${score}/100 — ${level}**\n\n**Score Guide:**\n• 80-100: Excellent — you're a green champion!\n• 60-79: Good — above average efforts\n• 40-59: Average — global standard\n• 0-39: Needs improvement — time to act\n\n**To improve your score:**\n• Calculate your carbon footprint regularly\n• Complete eco challenges for points\n• Reduce your highest emission category\n• ${biggest ? `Focus on ${biggest.name} (${biggest.value.toFixed(1)} kg) first` : 'Start with the calculator'}`;
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hello! 👋 I'm CarbonWise AI Coach — your personal sustainability guide!\n\n${total > 0 ? `I can see your carbon footprint is **${total.toFixed(1)} kg CO₂/month**. Your biggest source is **${biggest?.name}** at ${biggest?.value.toFixed(1)} kg.` : 'Start by calculating your carbon footprint to get personalized advice!'}\n\nI can help you with:\n• 🚗 Reducing transport emissions\n• ⚡ Saving electricity\n• 🍽️ Eco-friendly diet tips\n• 🌳 Carbon offsetting\n• 🏆 Improving your sustainability score\n\nWhat would you like to know?`;
  }

  if (msg.includes('weekly') || msg.includes('plan') || msg.includes('schedule') || msg.includes('routine')) {
    return `📅 **7-Day Eco Plan for You:**\n\n• **Mon:** Walk or cycle to work/college\n• **Tue:** Cook a plant-based meal, avoid meat\n• **Wed:** Audit your home — unplug unused devices\n• **Thu:** Use public transport instead of car\n• **Fri:** Zero-waste shopping — bring reusable bags\n• **Sat:** Plant something — herb garden, tree, or flowers\n• **Sun:** Plan next week's meals to reduce food waste\n\n${total > 0 ? `Following this plan consistently could reduce your ${total.toFixed(1)} kg/month footprint by ~15-20%.` : 'Track your progress with regular calculations!'}`;
  }

  // Default response
  return `🌿 **CarbonWise AI Coach**\n\n${total > 0
    ? `Based on your data:\n• Total emissions: **${total.toFixed(1)} kg CO₂/month**\n• Biggest source: **${biggest?.name}** (${biggest?.value.toFixed(1)} kg)\n• Sustainability score: **${carbonData?.sustainabilityScore}/100**\n\nTo reduce your footprint, focus on your **${biggest?.name}** emissions first!`
    : 'I\'m here to help you reduce your carbon footprint!'}\n\nAsk me about:\n• "How to reduce transport emissions?"\n• "Best ways to save electricity"\n• "How does diet affect emissions?"\n• "Give me a weekly eco plan"\n• "What are carbon offsets?"`;
};

const getRecommendationsResponse = (emissionData) => {
  const { transportEmission, electricityEmission, foodEmission, lifestyleEmission, totalEmission, sustainabilityScore } = emissionData;

  const sources = [
    { name: 'transport', value: transportEmission, cat: 'transport' },
    { name: 'electricity', value: electricityEmission, cat: 'electricity' },
    { name: 'food', value: foodEmission, cat: 'food' },
    { name: 'lifestyle', value: lifestyleEmission, cat: 'lifestyle' },
  ].sort((a, b) => b.value - a.value);

  return {
    summary: `Your monthly carbon footprint is ${totalEmission.toFixed(1)} kg CO₂, giving you a sustainability score of ${sustainabilityScore}/100. Your biggest contributor is ${sources[0].name} at ${sources[0].value.toFixed(1)} kg — focusing here will have the most impact.`,
    topIssue: `${sources[0].name.charAt(0).toUpperCase() + sources[0].name.slice(1)} (${sources[0].value.toFixed(1)} kg CO₂/month — ${((sources[0].value / totalEmission) * 100).toFixed(0)}% of total)`,
    tips: [
      { title: 'Switch to Public Transport', description: 'Use bus or train instead of car 3 days per week to significantly cut transport emissions.', impact: `~${(transportEmission * 0.25).toFixed(1)} kg CO₂/month reduction`, category: 'transport' },
      { title: 'LED Lighting & Standby Power', description: 'Replace all bulbs with LED and unplug devices on standby. Easy wins with big cumulative impact.', impact: `~${(electricityEmission * 0.15).toFixed(1)} kg CO₂/month reduction`, category: 'electricity' },
      { title: 'Meat-Free Days', description: 'Try 3 vegetarian days per week. Animal agriculture is one of the largest emission contributors.', impact: `~${(foodEmission * 0.2).toFixed(1)} kg CO₂/month reduction`, category: 'food' },
      { title: 'Reusable Products', description: 'Switch to reusable bags, water bottles, and containers. Refuse single-use plastic consistently.', impact: `~${(lifestyleEmission * 0.3).toFixed(1)} kg CO₂/month reduction`, category: 'lifestyle' },
      { title: 'Cycle or Walk Short Trips', description: 'For distances under 5km, cycling or walking produces zero emissions and improves health.', impact: `~${(transportEmission * 0.1).toFixed(1)} kg CO₂/month reduction`, category: 'transport' },
    ],
    weeklyPlan: [
      'Mon-Tue: Use public transport instead of car',
      'Wed-Thu: Cook plant-based meals, reduce meat',
      'Fri-Sat: Zero-waste shopping with reusable bags',
      'Sun: Energy audit — unplug unused devices',
    ],
    offsetSuggestions: [
      'Plant 5 trees this month (~105 kg CO₂ absorbed/year)',
      'Purchase verified carbon credits for remaining emissions',
      'Support local renewable energy or reforestation projects',
    ],
  };
};

module.exports = { getChatResponse, getRecommendationsResponse };
