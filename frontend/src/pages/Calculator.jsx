import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { carbonAPI } from '../services/api';
import { auth } from '../firebase/config';
import EmissionBreakdown from '../components/ui/EmissionBreakdown';
import ScoreGauge from '../components/ui/ScoreGauge';
import { formatNumber } from '../utils/helpers';
import toast from 'react-hot-toast';

const steps = ['Transport', 'Energy', 'Food', 'Lifestyle', 'Results'];

// ─── Local fallback calculation (mirrors backend logic) ───────────────────────
const EMISSION_FACTORS = {
  transport: {
    car_petrol: 0.21, car_diesel: 0.17, car_electric: 0.05,
    motorcycle: 0.11, bus: 0.089, train: 0.041,
    plane: 0.255, bicycle: 0, walking: 0,
  },
  electricity: { default: 0.82 },
  food: { vegan: 1.5, vegetarian: 2.5, mixed: 4.0, meat_heavy: 7.0 },
  lifestyle: {
    shopping: { rarely: 10, sometimes: 25, often: 50, very_often: 80 },
    plastic:  { low: 5,    medium: 15,    high: 30,  very_high: 50  },
  },
};

const localCalculate = ({ transport, electricity, food, lifestyle }) => {
  const tFactor = EMISSION_FACTORS.transport[transport.vehicleType] ?? 0.21;
  const transportEmission  = parseFloat((tFactor * transport.dailyDistance * (transport.daysPerWeek ?? 5) * 4.33).toFixed(2));
  const electricityEmission = parseFloat((EMISSION_FACTORS.electricity.default * electricity.monthlyUnits).toFixed(2));
  const foodFactor = EMISSION_FACTORS.food[food.dietType] ?? 4.0;
  const foodEmission       = parseFloat((foodFactor * 30).toFixed(2));
  const shoppingEmission   = EMISSION_FACTORS.lifestyle.shopping[lifestyle.shoppingFrequency] ?? 25;
  const plasticEmission    = EMISSION_FACTORS.lifestyle.plastic[lifestyle.plasticConsumption]  ?? 15;
  const lifestyleEmission  = parseFloat((shoppingEmission + plasticEmission).toFixed(2));
  const totalEmission      = parseFloat((transportEmission + electricityEmission + foodEmission + lifestyleEmission).toFixed(2));

  let sustainabilityScore = 10;
  if (totalEmission <= 50)  sustainabilityScore = 100;
  else if (totalEmission <= 100) sustainabilityScore = 90;
  else if (totalEmission <= 150) sustainabilityScore = 80;
  else if (totalEmission <= 200) sustainabilityScore = 70;
  else if (totalEmission <= 250) sustainabilityScore = 60;
  else if (totalEmission <= 300) sustainabilityScore = 50;
  else if (totalEmission <= 350) sustainabilityScore = 40;
  else if (totalEmission <= 400) sustainabilityScore = 30;
  else if (totalEmission <= 450) sustainabilityScore = 20;

  const scoreLevel =
    sustainabilityScore >= 80 ? { level: 'Excellent', color: 'green' } :
    sustainabilityScore >= 60 ? { level: 'Good',      color: 'blue'  } :
    sustainabilityScore >= 40 ? { level: 'Average',   color: 'yellow'} :
    { level: 'Needs Improvement', color: 'red' };

  return { transportEmission, electricityEmission, foodEmission, lifestyleEmission, totalEmission, sustainabilityScore, scoreLevel };
};
// ──────────────────────────────────────────────────────────────────────────────

const Calculator = () => {
  const [step, setStep]       = useState(0);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const navigate = useNavigate();

  const { register, getValues } = useForm({
    defaultValues: {
      vehicleType:       'car_petrol',
      dailyDistance:     20,
      daysPerWeek:       5,
      monthlyUnits:      200,
      dietType:          'mixed',
      shoppingFrequency: 'sometimes',
      plasticConsumption:'medium',
    },
  });

  const buildPayload = () => {
    const v = getValues();
    return {
      transport:   { vehicleType: v.vehicleType, dailyDistance: Number(v.dailyDistance), daysPerWeek: Number(v.daysPerWeek) },
      electricity: { monthlyUnits: Number(v.monthlyUnits) },
      food:        { dietType: v.dietType },
      lifestyle:   { shoppingFrequency: v.shoppingFrequency, plasticConsumption: v.plasticConsumption },
    };
  };

  const calculateEmissions = async () => {
    setLoading(true);
    const payload = buildPayload();
    try {
      // Try backend first
      const res = await carbonAPI.calculate(payload);
      setResult({ ...res.data.data, inputPayload: payload });
      setStep(4);
    } catch (err) {
      // Fallback: calculate locally so the user never sees a hard failure
      console.warn('Backend unavailable, using local calculation:', err?.response?.data?.message || err.message);
      try {
        const local = localCalculate(payload);
        setResult({ ...local, inputPayload: payload, calculatedLocally: true });
        setStep(4);
        toast.success('Calculated locally 🌿 (Backend offline — results not saved yet)');
      } catch (localErr) {
        toast.error('Calculation failed: ' + localErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      // Force-refresh Firebase token before saving to avoid stale token
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
      await carbonAPI.save(result.inputPayload);
      toast.success('Carbon data saved! 🌿');
      navigate('/dashboard');
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err.message || '';

      if (status === 401) {
        toast.error('Session expired. Please refresh the page and try again.');
      } else if (status === 503 || msg.includes('database') || msg.includes('buffering')) {
        toast.error('Database connection issue. Please try again in a moment.');
      } else if (status === 400) {
        toast.error('Invalid data: ' + msg);
      } else {
        toast.error('Failed to save. Please try again.');
        console.error('Save error:', err);
      }
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 3) { calculateEmissions(); return; }
    setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => s - 1);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step  ? 'bg-primary-600 text-white' :
                  i === step ? 'bg-primary-600 text-white ring-2 ring-primary-400/50' :
                  'bg-carbon-800 text-carbon-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${i === step ? 'text-primary-400' : 'text-carbon-600'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary-600' : 'bg-carbon-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 0: Transport ── */}
        {step === 0 && (
          <motion.div key="transport" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🚗</span>
              <div>
                <h2 className="text-xl font-bold text-white">Transportation</h2>
                <p className="text-sm text-carbon-400">How do you get around?</p>
              </div>
            </div>
            <div>
              <label className="label">Primary Vehicle Type</label>
              <select {...register('vehicleType')} className="input">
                <option value="car_petrol">Car (Petrol)</option>
                <option value="car_diesel">Car (Diesel)</option>
                <option value="car_electric">Car (Electric)</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="bus">Bus</option>
                <option value="train">Train / Metro</option>
                <option value="bicycle">Bicycle</option>
                <option value="walking">Walking</option>
              </select>
            </div>
            <div>
              <label className="label">Daily Distance (km)</label>
              <input {...register('dailyDistance', { min: 0, max: 1000 })} type="number" className="input" min="0" max="1000" />
              <p className="text-xs text-carbon-500 mt-1">Average km traveled per day</p>
            </div>
            <div>
              <label className="label">Days Per Week</label>
              <select {...register('daysPerWeek')} className="input">
                {[1,2,3,4,5,6,7].map((d) => (
                  <option key={d} value={d}>{d} {d === 1 ? 'day' : 'days'}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Energy ── */}
        {step === 1 && (
          <motion.div key="energy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">⚡</span>
              <div>
                <h2 className="text-xl font-bold text-white">Energy Usage</h2>
                <p className="text-sm text-carbon-400">Your electricity consumption</p>
              </div>
            </div>
            <div>
              <label className="label">Monthly Electricity Usage (kWh / Units)</label>
              <input {...register('monthlyUnits', { min: 0 })} type="number" className="input" min="0" />
              <p className="text-xs text-carbon-500 mt-1">Check your electricity bill for monthly units consumed</p>
            </div>
            <div className="bg-carbon-800 rounded-xl p-4 text-sm text-carbon-400">
              <p className="font-semibold text-carbon-300 mb-2">💡 Quick Guide</p>
              <ul className="space-y-1">
                <li>• Small apartment: ~100–150 units/month</li>
                <li>• Medium home: ~200–350 units/month</li>
                <li>• Large home: ~400–600 units/month</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Food ── */}
        {step === 2 && (
          <motion.div key="food" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🍽️</span>
              <div>
                <h2 className="text-xl font-bold text-white">Food &amp; Diet</h2>
                <p className="text-sm text-carbon-400">What do you typically eat?</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'vegan',      label: 'Vegan',       desc: 'Plant-based only',       icon: '🥦', emission: '~45 kg/month'  },
                { value: 'vegetarian', label: 'Vegetarian',  desc: 'No meat',                icon: '🥗', emission: '~75 kg/month'  },
                { value: 'mixed',      label: 'Mixed Diet',  desc: 'Occasional meat',        icon: '🍱', emission: '~120 kg/month' },
                { value: 'meat_heavy', label: 'Meat Heavy',  desc: 'Daily meat consumption', icon: '🥩', emission: '~210 kg/month' },
              ].map((diet) => {
                const current = getValues('dietType');
                return (
                  <label key={diet.value} className="cursor-pointer">
                    <input {...register('dietType')} type="radio" value={diet.value} className="hidden" />
                    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      current === diet.value
                        ? 'border-primary-500 bg-primary-600/10'
                        : 'border-carbon-700 bg-carbon-800 hover:border-carbon-600'
                    }`}>
                      <span className="text-2xl">{diet.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{diet.label}</p>
                        <p className="text-xs text-carbon-500">{diet.desc}</p>
                      </div>
                      <span className="text-xs text-carbon-500">{diet.emission}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Lifestyle ── */}
        {step === 3 && (
          <motion.div key="lifestyle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🛍️</span>
              <div>
                <h2 className="text-xl font-bold text-white">Lifestyle</h2>
                <p className="text-sm text-carbon-400">Your shopping &amp; plastic habits</p>
              </div>
            </div>
            <div>
              <label className="label">Shopping Frequency</label>
              <select {...register('shoppingFrequency')} className="input">
                <option value="rarely">Rarely (few times/year)</option>
                <option value="sometimes">Sometimes (monthly)</option>
                <option value="often">Often (weekly)</option>
                <option value="very_often">Very Often (daily/near daily)</option>
              </select>
            </div>
            <div>
              <label className="label">Plastic Consumption</label>
              <select {...register('plasticConsumption')} className="input">
                <option value="low">Low (reusable bags, bottles)</option>
                <option value="medium">Medium (occasional plastic)</option>
                <option value="high">High (frequent single-use plastic)</option>
                <option value="very_high">Very High (plastic everything)</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Results ── */}
        {step === 4 && result && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            {result.calculatedLocally && (
              <div className="flex items-center gap-3 p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-xl text-sm text-yellow-400">
                ⚠️ Calculated offline — connect MongoDB Atlas to save results permanently.
              </div>
            )}

            {/* Total */}
            <div className="card text-center bg-gradient-to-br from-primary-900/40 to-carbon-900">
              <h2 className="text-lg font-bold text-carbon-400 mb-2">Your Monthly Carbon Footprint</h2>
              <div className="text-5xl font-black gradient-text mb-2">{formatNumber(result.totalEmission)}</div>
              <p className="text-carbon-400 text-lg font-semibold">kg CO₂ / month</p>
              <p className="mt-2 text-xs text-carbon-500">Global average: ~333 kg CO₂/month</p>
            </div>

            {/* Score + Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="card flex flex-col items-center">
                <h3 className="text-base font-bold text-white mb-4 self-start">Sustainability Score</h3>
                <ScoreGauge score={result.sustainabilityScore} size={140} />
              </div>
              <div className="card">
                <h3 className="text-base font-bold text-white mb-4">Emission Breakdown</h3>
                <EmissionBreakdown data={result} />
              </div>
            </div>

            {/* Category bars */}
            <div className="card">
              <h3 className="text-base font-bold text-white mb-4">Category Analysis</h3>
              <div className="space-y-3">
                {[
                  { label: 'Transport',   value: result.transportEmission,   icon: '🚗', color: 'bg-orange-500' },
                  { label: 'Electricity', value: result.electricityEmission, icon: '⚡', color: 'bg-yellow-500' },
                  { label: 'Food',        value: result.foodEmission,        icon: '🍽️', color: 'bg-green-500'  },
                  { label: 'Lifestyle',   value: result.lifestyleEmission,   icon: '🛍️', color: 'bg-purple-500' },
                ].map((cat) => (
                  <div key={cat.label} className="flex items-center gap-3">
                    <span className="text-xl w-7">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-carbon-400">{cat.label}</span>
                        <span className="text-white font-semibold">{formatNumber(cat.value)} kg</span>
                      </div>
                      <div className="w-full bg-carbon-800 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(cat.value / result.totalEmission) * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-2 rounded-full ${cat.color}`}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-carbon-500 w-10 text-right">
                      {((cat.value / result.totalEmission) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => { setStep(0); setResult(null); }} className="btn-secondary flex-1">
                🔄 Recalculate
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : '💾 Save Results'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={prevStep} className="btn-secondary flex-1">← Back</button>
          )}
          <button onClick={nextStep} disabled={loading} className="btn-primary flex-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Calculating...
              </div>
            ) : step === 3 ? '🧮 Calculate Emissions' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Calculator;
