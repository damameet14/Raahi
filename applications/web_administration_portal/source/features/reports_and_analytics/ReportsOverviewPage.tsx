/**
 * Reports and analytics page with trip statistics and charts.
 */

import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';
import { PageHeader } from '@/shared_user_interface_infrastructure/reusable_components/PageHeader';
import { LoadingSpinner } from '@/shared_user_interface_infrastructure/reusable_components/LoadingSpinner';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6'];

export function ReportsOverviewPage() {
  const summaryQuery = useQuery({
    queryKey: ['trip-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/trips/summary');
      return response.data;
    },
  });

  const monthlyQuery = useQuery({
    queryKey: ['monthly-trips'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/trips/monthly');
      return response.data;
    },
  });

  if (summaryQuery.isLoading) return <LoadingSpinner message="Loading reports..." />;

  const summary = summaryQuery.data;
  const monthlyData = monthlyQuery.data || [];

  const fuelDistributionData = [
    { name: 'Consumed', value: summary?.total_fuel_consumed_liters || 0 },
    { name: 'Saved (est.)', value: (summary?.total_fuel_consumed_liters || 0) * 0.4 },
  ];

  const summaryCards = [
    { label: 'Total Trips', value: summary?.total_trips || 0 },
    { label: 'Total Distance', value: `${(summary?.total_distance_kilometers || 0).toFixed(1)} km` },
    { label: 'Fuel Consumed', value: `${(summary?.total_fuel_consumed_liters || 0).toFixed(1)} L` },
    { label: 'Total Cost', value: `₹${(summary?.total_trip_cost || 0).toFixed(0)}` },
    { label: 'Passengers Carried', value: summary?.total_passengers_carried || 0 },
    { label: 'Avg Distance/Trip', value: `${(summary?.average_distance_per_trip || 0).toFixed(1)} km` },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports & Analytics" description="Trip statistics, fuel consumption, and cost analysis" />

      {/* ── Summary cards ────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="glass-card p-4 text-center">
            <p className="text-xs font-medium text-text-secondary">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly cost chart */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Monthly Trip Cost (₹)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
              <Bar dataKey="total_cost" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fuel distribution pie */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Fuel Impact</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={fuelDistributionData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {fuelDistributionData.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly fuel trend */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Monthly Fuel Consumption (L)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
              <Area type="monotone" dataKey="total_fuel" stroke="#f43f5e" fill="url(#roseGradient)" strokeWidth={2} />
              <defs>
                <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly participation */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Monthly Trip Participation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
              <Bar dataKey="trip_count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Trips" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
