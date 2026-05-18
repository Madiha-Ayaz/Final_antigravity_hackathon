'use client';

import { useState } from 'react';
import { DashboardLayout } from '../../components';
import LiveMap from '../../components/LiveMap';

export default function DashboardPage() {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const stats = [
    {
      label: 'Monitoring Status',
      value: isMonitoring ? 'Active' : 'Inactive',
      icon: '🛡️',
      color: isMonitoring ? 'success' : 'danger',
      trend: null,
    },
    {
      label: 'Total Alerts',
      value: '0',
      icon: '🚨',
      color: 'primary',
      trend: null,
    },
    {
      label: 'False Alarms',
      value: '0',
      icon: '✓',
      color: 'warning',
      trend: null,
    },
    {
      label: 'Trusted Contacts',
      value: '3',
      icon: '👥',
      color: 'secondary',
      trend: null,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'system',
      title: 'Monitoring Started',
      description: 'Voice detection activated successfully',
      timestamp: '2 hours ago',
      icon: '✓',
      color: 'success',
    },
    {
      id: 2,
      type: 'contact',
      title: 'Contact Added',
      description: 'John Doe added as trusted contact',
      timestamp: '1 day ago',
      icon: '👤',
      color: 'secondary',
    },
    {
      id: 3,
      type: 'settings',
      title: 'Settings Updated',
      description: 'Emergency preferences configured',
      timestamp: '2 days ago',
      icon: '⚙️',
      color: 'primary',
    },
  ];

  return (
    <DashboardLayout userName="User">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back! Here's your emergency protection overview.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn-outline">
              <svg
                className="w-5 h-5 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Settings
            </button>
            <button className="btn-primary">
              <svg
                className="w-5 h-5 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Contact
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="card-hover animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      stat.color === 'success'
                        ? 'text-success-600'
                        : stat.color === 'danger'
                          ? 'text-danger-600'
                          : stat.color === 'warning'
                            ? 'text-warning-600'
                            : stat.color === 'secondary'
                              ? 'text-secondary-600'
                              : 'text-primary-600'
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    stat.color === 'success'
                      ? 'bg-success-100 dark:bg-success-900/20'
                      : stat.color === 'danger'
                        ? 'bg-danger-100 dark:bg-danger-900/20'
                        : stat.color === 'warning'
                          ? 'bg-warning-100 dark:bg-warning-900/20'
                          : stat.color === 'secondary'
                            ? 'bg-secondary-100 dark:bg-secondary-900/20'
                            : 'bg-primary-100 dark:bg-primary-900/20'
                  }`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Map & Status */}
          <div className="lg:col-span-2 card space-y-6 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Live Location Tracking
                </h2>
                <p className="text-sm text-gray-500">Real-time GPS synchronization</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <div className={`text-xs font-bold ${isMonitoring ? 'text-success-600' : 'text-danger-600'}`}>
                       {isMonitoring ? 'PROTECTION ON' : 'PROTECTION OFF'}
                    </div>
                    <div className="text-[10px] text-gray-400">AES-256 Encrypted</div>
                 </div>
                <div className="flex items-center gap-4">
                  <a 
                    href="/crisis" 
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
                  >
                    <span className="animate-pulse w-2 h-2 bg-white rounded-full"></span>
                    Crisis Control Center
                  </a>
                  <button 
                    onClick={() => setIsMonitoring(!isMonitoring)}
                    className={`px-8 py-3 rounded-xl font-bold transition-all ${
                      isMonitoring 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    }`}
                  >
                    {isMonitoring ? 'Stop Monitoring' : 'Start Monitor'}
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
               <LiveMap 
                  height="450px" 
                  onLocationUpdate={(lat, lng) => setCurrentLocation({lat, lng})}
                  emergencyMode={false} 
               />
               
               {!isMonitoring && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-dark-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                     <div className="text-center p-6 bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-100 max-w-xs">
                        <div className="text-4xl mb-3">🛡️</div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Monitoring Paused</h3>
                        <p className="text-sm text-gray-500 mb-4">Emergency detection is currently disabled. Live tracking is restricted.</p>
                        <button onClick={() => setIsMonitoring(true)} className="btn-primary w-full">Resume Protection</button>
                     </div>
                  </div>
               )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
               <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Signal</div>
                  <div className="text-sm font-bold text-success-600 flex items-center gap-1">
                     <div className="flex gap-0.5">
                        <div className="w-1 h-2 bg-success-500 rounded-full"></div>
                        <div className="w-1 h-3 bg-success-500 rounded-full"></div>
                        <div className="w-1 h-4 bg-success-500 rounded-full"></div>
                     </div>
                     Strong
                  </div>
               </div>
               <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Accuracy</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">± 5 meters</div>
               </div>
               <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status</div>
                  <div className="text-sm font-bold text-success-600">Encrypted</div>
               </div>
               <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Battery</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">84%</div>
               </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-4 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-xl transition-colors text-left">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Add Contact</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Set up trusted contacts
                  </div>
                </div>
              </button>

              <button className="w-full flex items-center space-x-3 p-4 bg-secondary-50 dark:bg-secondary-900/20 hover:bg-secondary-100 dark:hover:bg-secondary-900/30 rounded-xl transition-colors text-left">
                <div className="w-10 h-10 bg-secondary-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Test Alert</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Send test notification
                  </div>
                </div>
              </button>

              <button className="w-full flex items-center space-x-3 p-4 bg-warning-50 dark:bg-warning-900/20 hover:bg-warning-100 dark:hover:bg-warning-900/30 rounded-xl transition-colors text-left">
                <div className="w-10 h-10 bg-warning-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Configure</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Adjust settings</div>
                </div>
              </button>

              <button className="w-full flex items-center space-x-3 p-4 bg-success-50 dark:bg-success-900/20 hover:bg-success-100 dark:hover:bg-success-900/30 rounded-xl transition-colors text-left">
                <div className="w-10 h-10 bg-success-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">View History</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Check past events</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                    activity.color === 'success'
                      ? 'bg-success-100 dark:bg-success-900/20'
                      : activity.color === 'secondary'
                        ? 'bg-secondary-100 dark:bg-secondary-900/20'
                        : 'bg-primary-100 dark:bg-primary-900/20'
                  }`}
                >
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white">{activity.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                  {activity.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
