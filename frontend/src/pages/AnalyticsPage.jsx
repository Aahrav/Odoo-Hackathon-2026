import { useState, useEffect } from 'react'
import { dashboardApi } from '../api/dashboard'
import CustomSelect from '../components/CustomSelect'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts'

export default function AnalyticsPage() {
  const [reportData, setReportData] = useState({ roi: [], fuelEfficiency: [] })
  const [loading, setLoading] = useState(true)

  // Filter States
  const [dateRange, setDateRange] = useState('YTD')
  const [region, setRegion] = useState('All')
  const [vehicleType, setVehicleType] = useState('All')

  // Custom Chart State
  const [customChartMetric, setCustomChartMetric] = useState('estimatedRevenue')
  const [customChartType, setCustomChartType] = useState('Bar')

  useEffect(() => {
    setLoading(true)
    dashboardApi.getFinancialReports()
      .then(res => {
        if (res.success) {
          setReportData(res.data)
        }
      })
      .catch(err => console.error("Failed to load analytics:", err))
      .finally(() => setLoading(false))
  }, [])

  // Calculate stats for each vehicle by merging ROI and Fuel Efficiency views
  const vehicleStats = reportData.roi.map((r) => {
    const fe = reportData.fuelEfficiency.find(f => f.vehicle_id === r.vehicle_id)
    
    const maintCost = Number(r.total_maintenance_cost || 0)
    const fuelCost = Number(r.total_fuel_cost || 0)
    const totalOperationalCost = maintCost + fuelCost
    const estimatedRevenue = Number(r.total_revenue || 0)
    const acquisitionCost = Number(r.acquisition_cost || 0)
    
    // The backend ROI is a decimal (e.g. 0.1234), so multiply by 100
    const roiPercentage = (Number(r.roi || 0) * 100).toFixed(2)

    return {
      id: r.vehicle_id,
      name: r.registration_number, // Using reg number as identifier if name isn't returned
      registrationNumber: r.registration_number,
      acquisitionCost,
      estimatedRevenue,
      maintCost,
      fuelCost,
      totalOperationalCost,
      distanceTraveled: Number(fe?.total_distance_km || 0),
      fuelEfficiency: fe?.km_per_liter ? Number(fe.km_per_liter).toFixed(2) : 'N/A',
      roi: roiPercentage,
    }
  })

  // Export CSV Function
  const exportToCSV = () => {
    window.open('/api/v1/reports/export?type=csv&report=operational-cost', '_blank')
  }

  // Print PDF Trigger
  const handlePrintPDF = () => {
    window.print()
  }

  // Summary Metrics
  const totalExpensesVal = vehicleStats.reduce((sum, s) => sum + s.totalOperationalCost, 0)
  const totalRevenueVal = vehicleStats.reduce((sum, s) => sum + s.estimatedRevenue, 0)
  const totalDistanceVal = vehicleStats.reduce((sum, s) => sum + s.distanceTraveled, 0)
  const avgRoiVal = vehicleStats.length > 0 
    ? (vehicleStats.reduce((sum, s) => sum + parseFloat(s.roi), 0) / vehicleStats.length).toFixed(2)
    : '0.00'

  // Data for Cost Distribution Pie Chart
  const totalMaint = vehicleStats.reduce((sum, s) => sum + s.maintCost, 0)
  const totalFuel = vehicleStats.reduce((sum, s) => sum + s.fuelCost, 0)
  const costDistributionData = [
    { name: 'Fuel Costs', value: totalFuel },
    { name: 'Maintenance Costs', value: totalMaint }
  ]
  const COLORS = ['#0ea5e9', '#f43f5e'] // Sky Blue, Rose Red

  // Data for Fuel Efficiency Area Chart (exclude N/A)
  const efficiencyData = vehicleStats
    .filter(s => s.fuelEfficiency !== 'N/A')
    .map(s => ({
      name: s.name,
      efficiency: Number(s.fuelEfficiency)
    }))

  const getMetricLabel = (key) => {
    switch (key) {
      case 'estimatedRevenue': return 'Est. Revenue'
      case 'totalOperationalCost': return 'Operational Cost'
      case 'maintCost': return 'Maintenance Cost'
      case 'fuelCost': return 'Fuel Cost'
      case 'distanceTraveled': return 'Distance Traveled'
      case 'roi': return 'ROI (%)'
      default: return 'Value'
    }
  }

  if (loading) return <LoadingSpinner message="Generating analytics report..." />

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-10">
      {/* Left Column - Controls & Summary */}
      <div className="w-full lg:w-1/3 xl:w-[30%] space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Fleet performance dashboards, fuel metrics, and return on investment ledger.</p>
        </div>

        {/* Report Configuration Form */}
        <div className="space-y-5">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 tracking-widest uppercase border-b border-slate-200 dark:border-slate-800 pb-2">
            Report Configuration
          </h2>
          
          <div className="space-y-4">
            <label className="block z-40">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Date Range</span>
              <div className="mt-1">
                <CustomSelect
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  options={[
                    { value: 'YTD', label: 'Year to Date (2026)' },
                    { value: 'Q4', label: 'Q4 2025' },
                    { value: 'Q3', label: 'Q3 2025' }
                  ]}
                />
              </div>
            </label>

            <label className="block z-30">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Region / Hub</span>
              <div className="mt-1">
                <CustomSelect
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  options={[
                    { value: 'All', label: 'All Regions' },
                    { value: 'Vadodara', label: 'Vadodara Depot' },
                    { value: 'Ahmedabad', label: 'Ahmedabad Hub' }
                  ]}
                />
              </div>
            </label>

            <label className="block z-20">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase">Vehicle Type</span>
              <div className="mt-1">
                <CustomSelect
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  options={[
                    { value: 'All', label: 'All Types' },
                    { value: 'Van', label: 'Van' },
                    { value: 'Light Truck', label: 'Light Truck' },
                    { value: 'Heavy Truck', label: 'Heavy Truck' }
                  ]}
                />
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={exportToCSV}
              className="flex-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
            >
              Export CSV
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
            >
              Print PDF
            </button>
          </div>
        </div>

        {/* Analytical KPI Stack */}
        <div className="space-y-5 pt-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 tracking-widest uppercase border-b border-slate-200 dark:border-slate-800 pb-2">
            Summary Metrics
          </h2>
          
          <div className="space-y-3">
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30 rounded-2xl flex justify-between items-center">
              <span className="text-xs uppercase font-bold text-teal-800 dark:text-teal-400 tracking-wider">Total Op. Cost</span>
              <p className="text-lg font-bold text-teal-950 dark:text-teal-300">₹{totalExpensesVal.toLocaleString()}</p>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl flex justify-between items-center">
              <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 tracking-wider">Est. Revenue</span>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">₹{totalRevenueVal.toLocaleString()}</p>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl flex justify-between items-center">
              <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 tracking-wider">Total Distance</span>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{totalDistanceVal.toLocaleString()} km</p>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl flex justify-between items-center">
              <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 tracking-wider">Avg Fleet ROI</span>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{avgRoiVal}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Live Board */}
      <div className="w-full lg:w-2/3 xl:w-[70%] space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 tracking-widest uppercase">Performance Board</h2>
        </div>

        {/* Charts Grid */}
        {vehicleStats.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Custom Chart Builder */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm xl:col-span-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="font-bold text-slate-900 dark:text-white">Custom Analytics Explorer</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-56 z-20">
                    <CustomSelect
                      value={customChartMetric}
                      onChange={(e) => setCustomChartMetric(e.target.value)}
                      options={[
                        { value: 'estimatedRevenue', label: 'Est. Revenue (₹)' },
                        { value: 'totalOperationalCost', label: 'Operational Cost (₹)' },
                        { value: 'maintCost', label: 'Maintenance Cost (₹)' },
                        { value: 'fuelCost', label: 'Fuel Cost (₹)' },
                        { value: 'distanceTraveled', label: 'Distance Traveled (km)' },
                        { value: 'roi', label: 'Return on Investment (%)' },
                      ]}
                    />
                  </div>
                  <div className="w-40 z-20">
                    <CustomSelect
                      value={customChartType}
                      onChange={(e) => setCustomChartType(e.target.value)}
                      options={[
                        { value: 'Bar', label: 'Bar Chart' },
                        { value: 'Line', label: 'Line Chart' },
                        { value: 'Area', label: 'Area Chart' }
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {customChartType === 'Bar' ? (
                    <BarChart data={vehicleStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} 
                        tickFormatter={(val) => customChartMetric === 'roi' ? `${val}%` : customChartMetric === 'distanceTraveled' ? `${val}` : `₹${val.toLocaleString()}`} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: 'rgba(203, 213, 225, 0.2)' }}
                        formatter={(val) => customChartMetric === 'roi' ? `${val}%` : customChartMetric === 'distanceTraveled' ? `${val} km` : `₹${val.toLocaleString()}`}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                      <Bar dataKey={customChartMetric} name={getMetricLabel(customChartMetric)} fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  ) : customChartType === 'Line' ? (
                    <LineChart data={vehicleStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} 
                        tickFormatter={(val) => customChartMetric === 'roi' ? `${val}%` : customChartMetric === 'distanceTraveled' ? `${val}` : `₹${val.toLocaleString()}`} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(val) => customChartMetric === 'roi' ? `${val}%` : customChartMetric === 'distanceTraveled' ? `${val} km` : `₹${val.toLocaleString()}`}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                      <Line type="monotone" dataKey={customChartMetric} name={getMetricLabel(customChartMetric)} stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  ) : (
                    <AreaChart data={vehicleStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCustom" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} 
                        tickFormatter={(val) => customChartMetric === 'roi' ? `${val}%` : customChartMetric === 'distanceTraveled' ? `${val}` : `₹${val.toLocaleString()}`} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(val) => customChartMetric === 'roi' ? `${val}%` : customChartMetric === 'distanceTraveled' ? `${val} km` : `₹${val.toLocaleString()}`}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                      <Area type="monotone" dataKey={customChartMetric} name={getMetricLabel(customChartMetric)} stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCustom)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue vs Cost Analysis */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm xl:col-span-2">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6">Revenue vs Cost Analysis</h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vehicleStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      tickFormatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: 'rgba(203, 213, 225, 0.2)' }}
                      formatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                    <Bar dataKey="estimatedRevenue" name="Estimated Revenue" fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="totalOperationalCost" name="Operational Cost" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Distribution (Donut) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6">Cost Distribution</h3>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {costDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `₹${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fleet Efficiency (Bar) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6">Fleet Efficiency (km/L)</h3>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={efficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => `${value} km/L`}
                    />
                    <Bar dataKey="efficiency" name="Avg Efficiency" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">No financial data available to display.</p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 tracking-widest uppercase border-b border-slate-200 dark:border-slate-800 pb-2 pt-4">
            Vehicle Ledger
          </h3>
          {vehicleStats.map((s) => {
            const roiVal = parseFloat(s.roi)
            const isPositive = roiVal >= 0
            
            return (
              <div 
                key={s.id} 
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:shadow-md transition"
              >
                {/* Vehicle Identity */}
                <div className="min-w-[140px]">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{s.name}</h3>
                </div>
                
                {/* Center Metrics Grid */}
                <div className="flex-1 grid grid-cols-3 gap-4 w-full md:w-auto">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-1">Distance</p>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{s.distanceTraveled} km</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">{s.fuelEfficiency !== 'N/A' ? `${s.fuelEfficiency} km/L` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-1">Cost</p>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">₹{s.totalOperationalCost?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-1">Revenue</p>
                    <p className="font-semibold text-sm text-teal-700 dark:text-teal-400">₹{s.estimatedRevenue?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Right ROI Badge */}
                <div className="text-right flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-1 md:block hidden">Est. ROI</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 md:hidden">Estimated ROI</p>
                  <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold ${
                    isPositive 
                      ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30' 
                      : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30'
                  }`}>
                    {isPositive ? '▲' : '▼'} {s.roi}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
