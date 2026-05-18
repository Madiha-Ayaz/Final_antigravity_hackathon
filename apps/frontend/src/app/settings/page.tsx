'use client';

import { useState } from 'react';
import { DashboardLayout } from '../../components';

interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  priority: number;
  verified: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState<TrustedContact[]>([
    {
      id: '1',
      name: 'John Doe',
      phone: '+1 (555) 123-4567',
      email: 'john@example.com',
      priority: 1,
      verified: true,
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '+1 (555) 987-6543',
      email: 'jane@example.com',
      priority: 2,
      verified: true,
    },
  ]);

  const tabs = [
    { id: 'contacts', label: 'Trusted Contacts', icon: '👥' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <DashboardLayout userName="User">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your emergency response preferences and contacts
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-dark-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Trusted Contacts
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Add up to 3 contacts who will be notified in emergencies
                    </p>
                  </div>
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

                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {contact.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {contact.name}
                            </h3>
                            {contact.verified && (
                              <span className="badge-success">
                                <svg
                                  className="w-3 h-3 mr-1 inline"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Verified
                              </span>
                            )}
                            <span className="badge-primary">Priority {contact.priority}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {contact.phone}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            {contact.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="btn-ghost btn-sm">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button className="btn-ghost btn-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {contacts.length < 3 && (
                    <button className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-center">
                      <svg
                        className="w-8 h-8 mx-auto mb-2 text-gray-400"
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
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Add another trusted contact
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {3 - contacts.length} slot{3 - contacts.length !== 1 ? 's' : ''} remaining
                      </p>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="card space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Emergency Detection
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Voice Detection
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Continuously listen for emergency wake phrases
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-success-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">AI Analysis</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Use AI to analyze emotional stress patterns
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-success-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">GPS Tracking</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Include location in emergency alerts
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-success-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="divider"></div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Countdown Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Countdown Duration</label>
                      <select className="input">
                        <option value="5">5 seconds</option>
                        <option value="10" selected>
                          10 seconds
                        </option>
                        <option value="15">15 seconds</option>
                        <option value="30">30 seconds</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Time to cancel false alarms before alerting contacts
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Biometric Verification
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Require fingerprint/face ID to cancel alerts
                        </p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-success-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Notification Preferences
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">SMS Alerts</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Send SMS to trusted contacts during emergencies
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-success-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Email Notifications
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive email updates about system status
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-success-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Push Notifications
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Browser notifications for important events
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-dark-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Weekly Reports</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Summary of monitoring activity and system health
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-success-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Security Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Change Password</label>
                    <div className="space-y-3">
                      <input type="password" className="input" placeholder="Current password" />
                      <input type="password" className="input" placeholder="New password" />
                      <input type="password" className="input" placeholder="Confirm new password" />
                      <button className="btn-primary">Update Password</button>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="btn-outline btn-sm">Enable</button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Active Sessions</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage devices with access to your account
                      </p>
                    </div>
                    <button className="btn-outline btn-sm">View Sessions</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Profile Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      U
                    </div>
                    <div>
                      <button className="btn-outline btn-sm">Change Photo</button>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        JPG, PNG or GIF. Max size 2MB
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="label">Full Name</label>
                    <input type="text" className="input" defaultValue="User Name" />
                  </div>

                  <div>
                    <label className="label">Email Address</label>
                    <input type="email" className="input" defaultValue="user@example.com" />
                  </div>

                  <div>
                    <label className="label">Phone Number</label>
                    <input type="tel" className="input" defaultValue="+1 (555) 000-0000" />
                  </div>

                  <div>
                    <label className="label">Time Zone</label>
                    <select className="input">
                      <option>Pacific Time (PT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Central Time (CT)</option>
                      <option>Eastern Time (ET)</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button className="btn-primary">Save Changes</button>
                  </div>
                </div>
              </div>

              <div className="divider"></div>

              <div>
                <h2 className="text-xl font-semibold text-danger-600 mb-4">Danger Zone</h2>
                <div className="p-4 border-2 border-danger-200 dark:border-danger-800 rounded-xl">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Delete Account</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be
                    undone.
                  </p>
                  <button className="btn-danger">Delete Account</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
