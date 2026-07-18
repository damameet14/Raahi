/**
 * Dashboard overview page with prioritized administration metrics and trends.
 */

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Car,
  MapPin,
  UserCheck,
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

const chartAxisColor = '#647069';
const chartGridColor = '#e1e7e2';
const chartTooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e1e7e2',
  borderRadius: '8px',
  color: '#17251b',
};

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
  const totalEmployees = statistics?.total_employees || 0;
  const registeredVehicles = statistics?.registered_vehicles || 0;
  const totalTrips = statistics?.total_trips || 0;
  const activeDrivers = statistics?.active_drivers || 0;
  const rideRequests = statistics?.ride_requests || 0;
  const totalDistanceKilometers = statistics?.total_distance_kilometers || 0;
  const fuelSavedLiters = statistics?.fuel_saved_liters || 0;
  const carbonDioxideSavedKilograms =
    statistics?.estimated_carbon_dioxide_saved_kilograms || 0;
  const driverCoveragePercentage =
    totalEmployees > 0 ? Math.round((activeDrivers / totalEmployees) * 100) : 0;
  const vehicleCoverageRatio =
    activeDrivers > 0 ? `${registeredVehicles}:${activeDrivers}` : `${registeredVehicles}:0`;

  const primaryStatisticsCards = [
    {
      title: 'Employees onboarded',
      value: totalEmployees,
      icon: Users,
      gradient: 'gradient-raahi',
      change: 12,
      context: 'people in the commute program',
    },
    {
      title: 'Available vehicles',
      value: registeredVehicles,
      icon: Car,
      gradient: 'gradient-emerald',
      change: 8,
      context: `vehicle to driver ratio ${vehicleCoverageRatio}`,
    },
    {
      title: 'Trips completed',
      value: totalTrips,
      icon: MapPin,
      gradient: 'gradient-amber',
      change: 23,
      context: 'shared rides recorded',
    },
    {
      title: 'Active drivers',
      value: activeDrivers,
      icon: UserCheck,
      gradient: 'gradient-cyan',
      change: 5,
      context: `${driverCoveragePercentage}% of employees can drive`,
    },
  ];

  const contextMetrics = [
    { label: 'Open ride requests', value: rideRequests, helper: 'demand waiting for action' },
    { label: 'Shared distance', value: `${totalDistanceKilometers.toFixed(0)} km`, helper: 'total distance covered' },
    { label: 'Fuel saved', value: `${fuelSavedLiters.toFixed(0)} L`, helper: 'estimated operational saving' },
    { label: 'CO2 saved', value: `${carbonDioxideSavedKilograms.toFixed(0)} kg`, helper: 'estimated environmental impact' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="A focused view of adoption, availability, commute activity, and savings."
      />

      <section className="dashboard-purpose-strip" aria-label="Dashboard purpose">
        <div>
          <span>Purpose</span>
          <strong>Help admins see whether company carpooling is healthy today.</strong>
        </div>
        <div>
          <span>Priority</span>
          <strong>Adoption, capacity, trips, and measurable savings.</strong>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="primary-dashboard-metrics">
        <div className="dashboard-section-heading">
          <div>
            <span>01 / Most Important</span>
            <h2 id="primary-dashboard-metrics">Primary metrics</h2>
          </div>
          <p>Only the metrics an admin needs for a fast health check.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {primaryStatisticsCards.map((card, index) => (
            <div key={card.title} style={{ animationDelay: `${index * 50}ms` }}>
              <StatisticsCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                gradientClassName={card.gradient}
                changePercentage={card.change}
                changeLabel="monthly change"
                contextLabel={card.context}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="context-dashboard-metrics">
        <div className="dashboard-section-heading">
          <div>
            <span>02 / Context</span>
            <h2 id="context-dashboard-metrics">Supporting metrics</h2>
          </div>
          <p>Related numbers are grouped so the dashboard stays readable.</p>
        </div>

        <div className="dashboard-context-grid">
          {contextMetrics.map((metric) => (
            <article className="dashboard-context-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="dashboard-trends">
        <div className="dashboard-section-heading">
          <div>
            <span>03 / Trends</span>
            <h2 id="dashboard-trends">Monthly movement</h2>
          </div>
          <p>Simple charts answer comparison questions faster than extra cards.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="mb-1 text-base font-semibold text-text-primary">Trips by month</h3>
            <p className="mb-4 text-sm text-text-secondary">Shows demand and participation over time.</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="month" stroke={chartAxisColor} fontSize={12} />
                <YAxis stroke={chartAxisColor} fontSize={12} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="trip_count" fill="#32b45c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-1 text-base font-semibold text-text-primary">Distance trend</h3>
            <p className="mb-4 text-sm text-text-secondary">Shows the scale of shared travel in kilometers.</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="month" stroke={chartAxisColor} fontSize={12} />
                <YAxis stroke={chartAxisColor} fontSize={12} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="total_distance"
                  stroke="#249448"
                  fill="url(#emeraldGradient)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#32b45c" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#32b45c" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
