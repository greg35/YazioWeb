import { useState, useEffect } from 'react';
import { checkStatus, getData, refreshData, login } from './api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { RefreshCw, AlertCircle, CheckCircle, Droplets, Flame, Utensils, Settings, X } from 'lucide-react';
import './index.css';


function App() {
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetchStatusAndData();
  }, []);

  const fetchStatusAndData = async () => {
    try {
      const statusRes = await checkStatus();
      setStatus(statusRes);
      if (statusRes.data_exists) {
        const dataRes = await getData();
        setData(processData(dataRes));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshData();
      await fetchStatusAndData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login(loginForm.email, loginForm.password);
      await fetchStatusAndData();
      setShowLogin(false);
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const processData = (rawData) => {
    return Object.entries(rawData)
      .map(([date, dayData]) => ({
        date,
        calories: dayData.daily?.energy || 0,
        carbs: dayData.daily?.carb || 0,
        protein: dayData.daily?.protein || 0,
        fat: dayData.daily?.fat || 0,
        water: dayData.water?.water_intake || 0,
        originalData: dayData // Store original data for details view
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getMealItems = (dayData, mealType) => {
    if (!dayData?.consumed) return [];

    // Combine all product types
    const allProducts = [
      ...(dayData.consumed.products || []),
      ...(dayData.consumed.simple_products || []),
      ...(dayData.consumed.recipe_portions || []) // Note: recipe_portions might need resolving if they don't have direct nutrients/names
    ];

    // Filter by meal type
    return allProducts.filter(item => item.daytime === mealType);
  };

  if (!status) return <div className="flex items-center justify-center h-screen text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans relative">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            Yazio Dashboard
          </h1>
          <p className="text-slate-400">Track your nutrition journey</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setShowLogin(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading || !status.token_exists}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${loading
              ? 'bg-slate-700 cursor-not-allowed text-slate-400'
              : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-violet-500/25'
              }`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </header>

      {!status.token_exists && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-8 flex items-start gap-3 text-amber-200">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-semibold">Authentication Required</h3>
            <p className="text-sm opacity-90">
              Token file not found. Please click "Settings" to log in with your Yazio credentials.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8 flex items-center gap-3 text-red-200">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      )}

      {data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calories Chart */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <Flame className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-semibold">Calories Trend</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  onClick={(e) => {
                    console.log('Chart clicked', e);
                    if (e?.activePayload?.[0]) {
                      console.log('Payload found', e.activePayload[0].payload);
                      setSelectedDay(e.activePayload[0].payload);
                    } else {
                      console.log('No active payload');
                    }
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Macros Chart */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <Utensils className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">Macros Distribution</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  onClick={(e) => {
                    console.log('BarChart clicked', e);
                    if (e?.activePayload?.[0]) {
                      console.log('Payload found', e.activePayload[0].payload);
                      setSelectedDay(e.activePayload[0].payload);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                  />
                  <Legend />
                  <Bar dataKey="protein" stackId="a" fill="#10b981" name="Protein" />
                  <Bar dataKey="carbs" stackId="a" fill="#3b82f6" name="Carbs" />
                  <Bar dataKey="fat" stackId="a" fill="#eab308" name="Fat" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Chart */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Droplets className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold">Water Intake</h2>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(str) => str.slice(5)} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                  />
                  <Bar dataKey="water" fill="#06b6d4" name="Water (ml)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <p>No data available. Click "Sync Data" to fetch your latest stats.</p>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-white">Yazio Login</h2>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 flex items-center gap-2 text-red-200 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className={`w-full py-3 rounded-lg font-semibold mt-4 transition-all ${loginLoading
                  ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                  : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-violet-500/25'
                  }`}
              >
                {loginLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Meal Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Daily Details</h2>
                <p className="text-slate-400">{new Date(selectedDay.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-sm mb-1">Calories</div>
                  <div className="text-2xl font-bold text-orange-400">{Math.round(selectedDay.calories)} <span className="text-sm font-normal text-slate-500">kcal</span></div>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-sm mb-1">Protein</div>
                  <div className="text-2xl font-bold text-emerald-400">{Math.round(selectedDay.protein)} <span className="text-sm font-normal text-slate-500">g</span></div>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-sm mb-1">Carbs</div>
                  <div className="text-2xl font-bold text-blue-400">{Math.round(selectedDay.carbs)} <span className="text-sm font-normal text-slate-500">g</span></div>
                </div>
                <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-sm mb-1">Fat</div>
                  <div className="text-2xl font-bold text-yellow-400">{Math.round(selectedDay.fat)} <span className="text-sm font-normal text-slate-500">g</span></div>
                </div>
              </div>

              {/* Meals List */}
              {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                const mealItems = getMealItems(selectedDay.originalData, mealType);
                if (mealItems.length === 0) return null;

                const mealTotals = mealItems.reduce((acc, item) => ({
                  calories: acc.calories + (item.nutrients?.['energy.energy'] || 0),
                  protein: acc.protein + (item.nutrients?.['nutrient.protein'] || 0),
                  carbs: acc.carbs + (item.nutrients?.['nutrient.carb'] || 0),
                  fat: acc.fat + (item.nutrients?.['nutrient.fat'] || 0),
                }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                return (
                  <div key={mealType} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                      <h3 className="text-xl font-semibold capitalize text-violet-300">{mealType}</h3>
                      <div className="text-sm text-slate-400 font-mono">
                        {Math.round(mealTotals.calories)} kcal • P: {Math.round(mealTotals.protein)}g • C: {Math.round(mealTotals.carbs)}g • F: {Math.round(mealTotals.fat)}g
                      </div>
                    </div>
                    <div className="space-y-3">
                      {mealItems.map((item, idx) => (
                        <div key={idx} className="bg-slate-700/20 p-4 rounded-xl flex justify-between items-start hover:bg-slate-700/30 transition-colors">
                          <div>
                            <div className="font-medium text-slate-200">{item.name || 'Unknown Item'}</div>
                            <div className="text-sm text-slate-500 mt-1">
                              {item.amount && `${item.amount} ${item.serving || ''}`}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-bold text-orange-300">{Math.round(item.nutrients?.['energy.energy'] || 0)} kcal</div>
                            <div className="text-slate-500 space-x-2 text-xs mt-1">
                              <span className="text-emerald-400/80">P: {Math.round(item.nutrients?.['nutrient.protein'] || 0)}</span>
                              <span className="text-blue-400/80">C: {Math.round(item.nutrients?.['nutrient.carb'] || 0)}</span>
                              <span className="text-yellow-400/80">F: {Math.round(item.nutrients?.['nutrient.fat'] || 0)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
