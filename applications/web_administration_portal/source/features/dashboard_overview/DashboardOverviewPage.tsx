/**
 * Dashboard overview page with statistics cards and charts.
 */

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Car,
  MapPin,
  UserCheck,
  GitPullRequest,
  Route,
  Fuel,
  Leaf,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { apiClient } from '@/shared_user_interface_infrastructure/backend_communication/api_client';
import { StatisticsCard } from '@/shared_user_interface_infrastructure/reusable_components/StatisticsCard';
import { PageHeader } from '@/shared_user_interface_infrastructure/reusable_components/PageHeader';
import { LoadingSpinner } from '@/shared_user_interface_infrastructure/reusable_components/LoadingSpinner';

interface DashboardStatisticsData {
  total_employees: number;
  registered_vehicles: number;
  total_trips: number;
  active_drivers: number;
  ride_requests: number;
  total_distance_kilometers: number;
  fuel_saved_liters: number;
  estimated_carbon_dioxide_saved_kilograms: number;
}

interface MonthlyTripData {
  month: string;
  trip_count: number;
  total_distance: number;
  total_fuel: number;
  total_cost: number;
}

export function DashboardOverviewPage() {
  const dashboardStatisticsQuery = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardStatisticsData>('/api/v1/dashboard/statistics');
      return response.data;
    },
  });

  const monthlyTripsQuery = useQuery({
    queryKey: ['monthly-trip-statistics'],
    queryFn: async () => {
      const response = await apiClient.get<MonthlyTripData[]>('/api/v1/trips/monthly');
      return response.data;
    },
  });

  if (dashboardStatisticsQuery.isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const statistics = dashboardStatisticsQuery.data;
  const monthlyData = monthlyTripsQuery.data || [];

  const statisticsCards = [
    { title: 'Total Employees', value: statistics?.total_employees || 0, icon: Users, gradient: 'gradient-raahi', change: 12 },
    { title: 'Registered Vehicles', value: statistics?.registered_vehicles || 0, icon: Car, gradient: 'gradient-emerald', change: 8 },
    { title: 'Total Trips', value: statistics?.total_trips || 0, icon: MapPin, gradient: 'gradient-amber', change: 23 },
    { title: 'Active Drivers', value: statistics?.active_drivers || 0, icon: UserCheck, gradient: 'gradient-cyan', change: 5 },
    { title: 'Ride Requests', value: statistics?.ride_requests || 0, icon: GitPullRequest, gradient: 'gradient-rose', change: 18 },
    { title: 'Total Distance', value: `${(statistics?.total_distance_kilometers || 0).toFixed(0)} km`, icon: Route, gradient: 'gradient-raahi', change: 15 },
    { title: 'Fuel Saved', value: `${(statistics?.fuel_saved_liters || 0).toFixed(0)} L`, icon: Fuel, gradient: 'gradient-emerald', change: 20 },
    { title: 'CO₂ Saved', value: `${(statistics?.estimated_carbon_dioxide_saved_kilograms || 0).toFixed(0)} kg`, icon: Leaf, gradient: 'gradient-cyan', change: 22 },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Overview of your organization's carpooling metrics"
      />

      {/* ── Statistics cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statisticsCards.map((card, index) => (
          <div key={card.title} style={{ animationDelay: `${index * 50}ms` }}>
            <StatisticsCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              gradientClassName={card.gradient}
              changePercentage={card.change}
              changeLabel="vs last month"
            />
          </div>
        ))}
      </div>

      {/* ── Charts section ───────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Trips per month bar chart */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Monthly Trips</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                }}
              />
              <Bar dataKey="trip_count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distance trend area chart */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Distance Trend (km)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                }}
              />
              <Area
                type="monotone"
                dataKey="total_distance"
                stroke="#10b981"
                fill="url(#emeraldGradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
