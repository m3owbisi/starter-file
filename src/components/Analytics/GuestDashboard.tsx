"use client";

import React from "react";
import { 
  Upload, 
  Target, 
  Users, 
  TrendingUp, 
  Lock, 
  Sparkles,
  ArrowRight,
  BarChart3,
  Activity
} from "lucide-react";
import MetricsCard from "./MetricsCard";
import ProteinTypesChart from "./ProteinTypesChart";

const GuestDashboard: React.FC = () => {
  // limited mock data for guests
  const publicStats = {
    totalUploads: 45678,
    totalPredictions: 23456,
    totalUsers: 12134,
    avgSuccessRate: 87.5,
  };

  return (
    <div className="space-y-6">
      {/* header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white lowercase">
            analytics overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 lowercase">
            public platform statistics
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl">
          <Lock size={16} />
          <span className="text-sm font-medium lowercase">guest access - limited view</span>
        </div>
      </div>

      {/* upgrade cta banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3c50e0] via-[#6366f1] to-[#8b5cf6] p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold lowercase">unlock full analytics</h2>
              <p className="text-white/80 text-sm mt-1 lowercase">
                sign up for a free researcher account to access personalized insights, 
                detailed charts, and export capabilities
              </p>
            </div>
          </div>
          <a
            href="/auth-page/signup"
            className="flex items-center gap-2 px-6 py-3 bg-white text-[#3c50e0] font-semibold rounded-xl hover:bg-white/90 transition-colors lowercase whitespace-nowrap"
          >
            get started free
            <ArrowRight size={18} />
          </a>
        </div>
      </div>

      {/* public metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="total uploads"
          value={publicStats.totalUploads.toLocaleString()}
          subtitle="platform-wide"
          icon={<Upload size={20} />}
          color="primary"
        />
        <MetricsCard
          title="predictions made"
          value={publicStats.totalPredictions.toLocaleString()}
          subtitle="all time"
          icon={<Target size={20} />}
          color="success"
        />
        <MetricsCard
          title="researchers"
          value={publicStats.totalUsers.toLocaleString()}
          subtitle="active users"
          icon={<Users size={20} />}
          color="info"
        />
        <MetricsCard
          title="avg success rate"
          value={`${publicStats.avgSuccessRate}%`}
          subtitle="binding predictions"
          icon={<TrendingUp size={20} />}
          color="warning"
        />
      </div>

      {/* limited charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* protein types - allowed for guests */}
        <ProteinTypesChart />

        {/* locked chart placeholder */}
        <div className="analytics-chart-container relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Lock size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase">
              detailed uploads chart
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 lowercase max-w-xs">
              sign up to access daily upload trends and historical data
            </p>
            <a
              href="/auth-page/signup"
              className="mt-4 px-4 py-2 bg-[#3c50e0] text-white text-sm font-medium rounded-lg hover:bg-[#3345c7] transition-colors lowercase"
            >
              unlock now
            </a>
          </div>
          
          {/* blurred placeholder */}
          <div className="opacity-30 blur-sm pointer-events-none">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase mb-6">
              daily uploads
            </h3>
            <div className="h-[250px] flex items-end gap-2 p-4">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#3c50e0]/30 rounded-t"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* more locked content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* success rate - locked */}
        <div className="analytics-chart-container relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Lock size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase">
              binding success metrics
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 lowercase max-w-xs">
              detailed success rate analysis requires authentication
            </p>
          </div>
          
          <div className="opacity-30 blur-sm pointer-events-none">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase mb-6">
              binding success
            </h3>
            <div className="flex items-center justify-center h-[200px]">
              <div className="w-40 h-40 rounded-full border-8 border-[#10b981]/30"></div>
            </div>
          </div>
        </div>

        {/* activity - locked */}
        <div className="analytics-chart-container relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
              <Lock size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase">
              activity timeline
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 lowercase max-w-xs">
              track your research activity with a personalized timeline
            </p>
          </div>
          
          <div className="opacity-30 blur-sm pointer-events-none">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase mb-6">
              user activity
            </h3>
            <div className="h-[200px] flex items-end gap-1 p-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-[#8b5cf6]/30 to-[#8b5cf6]/10 rounded-t"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* features comparison */}
      <div className="analytics-chart-container">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white lowercase mb-6">
          what you'll get with a free account
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <BarChart3 size={24} />,
              title: "detailed charts",
              description: "interactive visualizations with full historical data",
            },
            {
              icon: <Activity size={24} />,
              title: "personal analytics",
              description: "track your uploads, predictions, and activity",
            },
            {
              icon: <Target size={24} />,
              title: "binding predictions",
              description: "ai-powered protein binding analysis",
            },
            {
              icon: <Upload size={24} />,
              title: "data export",
              description: "download reports in csv and pdf formats",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="w-12 h-12 rounded-xl bg-[#3c50e0]/10 flex items-center justify-center text-[#3c50e0] mb-3">
                {feature.icon}
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white lowercase">
                {feature.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 lowercase">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <a
            href="/auth-page/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3c50e0] text-white font-medium rounded-xl hover:bg-[#3345c7] transition-colors lowercase"
          >
            create free account
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
