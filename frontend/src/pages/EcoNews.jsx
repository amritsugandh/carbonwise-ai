import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Curated static eco news + dynamic tips
const ECO_ARTICLES = [
  {
    id: 1,
    title: 'Solar Power Hits Record Low Cost in 2026',
    summary: 'The cost of solar energy has dropped 90% in the last decade, making it the cheapest electricity source in history. Installing home solar now offers faster ROI than ever.',
    category: 'Energy',
    icon: '☀️',
    readTime: '3 min',
    impact: 'High',
    tip: 'Consider installing solar panels — payback period is now under 5 years in most regions.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-600/10',
    borderColor: 'border-yellow-600/20',
  },
  {
    id: 2,
    title: 'Plant-Based Diets Cut Food Emissions by 75%',
    summary: 'A landmark study across 55 countries shows switching to plant-based diets reduces food-related carbon emissions by up to 75%, while improving health outcomes.',
    category: 'Food',
    icon: '🥗',
    readTime: '4 min',
    impact: 'Very High',
    tip: 'Even replacing one meat meal per day saves ~1.5 kg CO₂ — that\'s 540 kg/year.',
    color: 'text-green-400',
    bgColor: 'bg-green-600/10',
    borderColor: 'border-green-600/20',
  },
  {
    id: 3,
    title: 'Electric Vehicles Reach Cost Parity with Petrol Cars',
    summary: 'EV purchase prices are now equal to petrol vehicles in most segments, with running costs 60% lower. Global EV sales surpassed 20 million units in 2025.',
    category: 'Transport',
    icon: '⚡',
    readTime: '5 min',
    impact: 'High',
    tip: 'An electric car produces 70% fewer lifetime emissions than a petrol equivalent.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-600/20',
  },
  {
    id: 4,
    title: 'Reforestation Projects Absorb 2.5B Tonnes CO₂ Annually',
    summary: 'Global reforestation efforts now offset 2.5 billion tonnes of CO₂ per year. Community tree-planting initiatives have grown 400% since 2020.',
    category: 'Nature',
    icon: '🌳',
    readTime: '3 min',
    impact: 'Medium',
    tip: 'Planting 10 trees offsets ~210 kg CO₂/year. Join a local initiative this weekend.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-600/10',
    borderColor: 'border-emerald-600/20',
  },
  {
    id: 5,
    title: 'Smart Home Devices Reduce Energy Waste by 30%',
    summary: 'AI-powered thermostats, smart lighting, and energy monitors are helping households reduce electricity consumption by an average of 30% with minimal lifestyle changes.',
    category: 'Energy',
    icon: '🏠',
    readTime: '4 min',
    impact: 'Medium',
    tip: 'A smart thermostat saves ~10-15% on heating/cooling — roughly 200 kg CO₂/year.',
    color: 'text-purple-400',
    bgColor: 'bg-purple-600/10',
    borderColor: 'border-purple-600/20',
  },
  {
    id: 6,
    title: 'Circular Economy Reduces Manufacturing Emissions 45%',
    summary: 'Companies adopting circular economy principles — designing for repair, reuse, and recycling — are achieving up to 45% reduction in manufacturing-related emissions.',
    category: 'Lifestyle',
    icon: '♻️',
    readTime: '4 min',
    impact: 'Medium',
    tip: 'Buy second-hand, repair before replacing. A refurbished phone saves ~50 kg CO₂ vs new.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-600/10',
    borderColor: 'border-orange-600/20',
  },
];

const ECO_FACTS = [
  { fact: 'Cutting food waste by half would eliminate 4-8% of global greenhouse gas emissions', icon: '🍱' },
  { fact: 'A single transatlantic flight produces more CO₂ than 2 months of average driving', icon: '✈️' },
  { fact: 'LED bulbs use 75% less energy and last 25x longer than incandescent bulbs', icon: '💡' },
  { fact: 'The fashion industry emits more CO₂ than aviation and shipping combined', icon: '👕' },
  { fact: 'Eating local food for one year saves as much CO₂ as not flying once transatlantic', icon: '🥬' },
  { fact: 'Charging your phone all night uses the same energy as a 10-minute shower', icon: '📱' },
  { fact: 'Remote work eliminates commute emissions — about 54 million tonnes CO₂/day globally', icon: '🏠' },
  { fact: 'One tree absorbs about 21 kg of CO₂ per year when fully grown', icon: '🌳' },
];

const EcoNews = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [factIndex, setFactIndex] = useState(0);

  // Rotate fact every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex(i => (i + 1) % ECO_FACTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const categories = ['All', 'Energy', 'Food', 'Transport', 'Nature', 'Lifestyle'];
  const filtered = selectedCategory === 'All'
    ? ECO_ARTICLES
    : ECO_ARTICLES.filter(a => a.category === selectedCategory);

  const impactColor = (impact) => {
    if (impact === 'Very High') return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (impact === 'High') return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-emerald-900/30 to-carbon-900">
        <h2 className="text-2xl font-black text-white mb-1">📰 Eco News & Tips</h2>
        <p className="text-carbon-400 text-sm">Stay informed with the latest in sustainability</p>
      </div>

      {/* Rotating Eco Fact */}
      <div className="card border border-primary-600/20 bg-gradient-to-r from-primary-900/20 to-carbon-900 overflow-hidden">
        <p className="text-xs font-bold text-primary-400 mb-2 uppercase tracking-widest">⚡ Did You Know?</p>
        <AnimatePresence mode="wait">
          <AnimatedFact key={factIndex} fact={ECO_FACTS[factIndex]} />
        </AnimatePresence>
        <div className="flex gap-1 mt-3">
          {ECO_FACTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setFactIndex(i)}
              className={`h-1 rounded-full transition-all ${i === factIndex ? 'w-6 bg-primary-500' : 'w-2 bg-carbon-700'}`}
            />
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-primary-600 text-white'
                : 'bg-carbon-800 text-carbon-400 hover:bg-carbon-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {filtered.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`card border cursor-pointer ${article.borderColor} hover:scale-[1.01] transition-all`}
            onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${article.bgColor} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>
                {article.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-white text-sm leading-tight">{article.title}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap flex-shrink-0 ${impactColor(article.impact)}`}>
                    {article.impact} Impact
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold ${article.color}`}>{article.category}</span>
                  <span className="text-carbon-600 text-xs">•</span>
                  <span className="text-xs text-carbon-500">{article.readTime} read</span>
                </div>
                <p className="text-xs text-carbon-400 leading-relaxed">
                  {expandedId === article.id ? article.summary : article.summary.slice(0, 100) + '...'}
                </p>
              </div>
            </div>

            {/* Expanded tip */}
            {expandedId === article.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 bg-primary-600/10 border border-primary-600/20 rounded-xl"
              >
                <p className="text-xs font-bold text-primary-400 mb-1">💡 Action Tip</p>
                <p className="text-sm text-carbon-300">{article.tip}</p>
              </motion.div>
            )}

            <p className={`text-xs mt-3 ${expandedId === article.id ? 'text-primary-400' : 'text-carbon-600'}`}>
              {expandedId === article.id ? '↑ Show less' : '↓ Read more'}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Challenge Suggestion */}
      <div className="card bg-gradient-to-r from-purple-900/20 to-carbon-900 border border-purple-600/20">
        <h3 className="text-lg font-bold text-white mb-3">🎯 This Week's Focus</h3>
        <p className="text-carbon-300 text-sm mb-4">
          Based on global sustainability trends, focus on <span className="text-purple-400 font-semibold">reducing transport emissions</span> this week. Transport accounts for 24% of global CO₂ emissions.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { action: 'Walk/cycle once this week', saving: '~5 kg CO₂', icon: '🚶' },
            { action: 'Take public transport twice', saving: '~8 kg CO₂', icon: '🚌' },
            { action: 'Plan a carpool this week', saving: '~12 kg CO₂', icon: '🚗' },
          ].map(a => (
            <div key={a.action} className="bg-carbon-800/50 rounded-xl p-3">
              <span className="text-xl block mb-1">{a.icon}</span>
              <p className="text-xs font-semibold text-white">{a.action}</p>
              <p className="text-xs text-primary-400 mt-1">Saves {a.saving}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Animated fact component
const AnimatedFact = ({ fact }) => (
  <motion.div
    key={fact.fact}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="flex items-start gap-3"
  >
    <span className="text-2xl">{fact.icon}</span>
    <p className="text-sm text-carbon-200 leading-relaxed">{fact.fact}</p>
  </motion.div>
);

export default EcoNews;
