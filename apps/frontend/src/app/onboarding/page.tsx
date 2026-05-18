'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    contacts: [
      { name: '', phone: '', email: '', priority: 1 },
      { name: '', phone: '', email: '', priority: 2 },
      { name: '', phone: '', email: '', priority: 3 },
    ],
    preferences: {
      voiceDetection: true,
      aiAnalysis: true,
      gpsTracking: true,
      countdownDuration: 10,
      biometricVerification: true,
    },
    permissions: {
      microphone: false,
      location: false,
      notifications: false,
    },
  });

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Welcome to SilentSiren',
      description: "Let's set up your emergency protection in just a few steps",
      icon: '👋',
    },
    {
      id: 2,
      title: 'Add Trusted Contacts',
      description: 'Choose up to 3 people who will be notified in emergencies',
      icon: '👥',
    },
    {
      id: 3,
      title: 'Configure Preferences',
      description: 'Customize how the system detects and responds to emergencies',
      icon: '⚙️',
    },
    {
      id: 4,
      title: 'Grant Permissions',
      description: 'Allow access to microphone, location, and notifications',
      icon: '🔐',
    },
    {
      id: 5,
      title: 'All Set!',
      description: 'Your emergency protection is ready to activate',
      icon: '✅',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const requestPermission = async (type: 'microphone' | 'location' | 'notifications') => {
    try {
      if (type === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setFormData({
          ...formData,
          permissions: { ...formData.permissions, microphone: true },
        });
      } else if (type === 'location') {
        navigator.geolocation.getCurrentPosition(
          () => {
            setFormData({
              ...formData,
              permissions: { ...formData.permissions, location: true },
            });
          },
          () => {}
        );
      } else if (type === 'notifications') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setFormData({
            ...formData,
            permissions: { ...formData.permissions, notifications: true },
          });
        }
      }
    } catch (error) {
      console.error('Permission denied:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Skip for now
            </button>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-secondary-600 transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="card animate-fade-in">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-glow">
                {steps[0].icon}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {steps[0].title}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                {steps[0].description}
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-12">
                {[
                  {
                    icon: '🎤',
                    title: 'Voice Detection',
                    desc: 'Passive listening for distress signals',
                  },
                  { icon: '🧠', title: 'AI Analysis', desc: 'Smart pattern recognition' },
                  {
                    icon: '📱',
                    title: 'Instant Alerts',
                    desc: 'Notify trusted contacts immediately',
                  },
                ].map((feature, index) => (
                  <div key={index} className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                    <div className="text-4xl mb-3">{feature.icon}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Add Contacts */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                  {steps[1].icon}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {steps[1].title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{steps[1].description}</p>
              </div>

              <div className="space-y-6">
                {formData.contacts.map((contact, index) => (
                  <div key={index} className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Contact {index + 1}
                        {index === 0 && (
                          <span className="ml-2 text-sm text-primary-600">(Primary)</span>
                        )}
                      </h3>
                      <span className="badge-primary">Priority {contact.priority}</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="label">Full Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="John Doe"
                          value={contact.name}
                          onChange={(e) => {
                            const newContacts = [...formData.contacts];
                            newContacts[index].name = e.target.value;
                            setFormData({ ...formData, contacts: newContacts });
                          }}
                        />
                      </div>
                      <div>
                        <label className="label">Phone Number</label>
                        <input
                          type="tel"
                          className="input"
                          placeholder="+1 (555) 000-0000"
                          value={contact.phone}
                          onChange={(e) => {
                            const newContacts = [...formData.contacts];
                            newContacts[index].phone = e.target.value;
                            setFormData({ ...formData, contacts: newContacts });
                          }}
                        />
                      </div>
                      <div>
                        <label className="label">Email (Optional)</label>
                        <input
                          type="email"
                          className="input"
                          placeholder="john@example.com"
                          value={contact.email}
                          onChange={(e) => {
                            const newContacts = [...formData.contacts];
                            newContacts[index].email = e.target.value;
                            setFormData({ ...formData, contacts: newContacts });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                        Why do we need this?
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        These contacts will receive SMS alerts with your location and audio evidence
                        during emergencies. You can add or change them anytime in settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                  {steps[2].icon}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {steps[2].title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{steps[2].description}</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Detection Features
                  </h3>

                  {[
                    {
                      key: 'voiceDetection',
                      label: 'Voice Detection',
                      description: 'Continuously listen for emergency wake phrases',
                    },
                    {
                      key: 'aiAnalysis',
                      label: 'AI Analysis',
                      description: 'Use AI to analyze emotional stress patterns',
                    },
                    {
                      key: 'gpsTracking',
                      label: 'GPS Location',
                      description: 'Include your location in emergency alerts',
                    },
                    {
                      key: 'biometricVerification',
                      label: 'Biometric Verification',
                      description: 'Require fingerprint/face ID to cancel alerts',
                    },
                  ].map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{pref.label}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pref.description}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({
                            ...formData,
                            preferences: {
                              ...formData.preferences,
                              [pref.key]:
                                !formData.preferences[
                                  pref.key as keyof typeof formData.preferences
                                ],
                            },
                          });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.preferences[pref.key as keyof typeof formData.preferences]
                            ? 'bg-success-600'
                            : 'bg-gray-300 dark:bg-dark-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.preferences[pref.key as keyof typeof formData.preferences]
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Countdown Duration
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Time to cancel false alarms before alerting contacts
                  </p>
                  <select
                    className="input"
                    value={formData.preferences.countdownDuration}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          countdownDuration: parseInt(e.target.value),
                        },
                      });
                    }}
                  >
                    <option value="5">5 seconds</option>
                    <option value="10">10 seconds (Recommended)</option>
                    <option value="15">15 seconds</option>
                    <option value="30">30 seconds</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Permissions */}
          {currentStep === 4 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                  {steps[3].icon}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {steps[3].title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{steps[3].description}</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'microphone',
                    icon: '🎤',
                    title: 'Microphone Access',
                    description: 'Required for voice detection and audio recording',
                    required: true,
                  },
                  {
                    key: 'location',
                    icon: '📍',
                    title: 'Location Access',
                    description: 'Share your GPS coordinates in emergency alerts',
                    required: true,
                  },
                  {
                    key: 'notifications',
                    icon: '🔔',
                    title: 'Notifications',
                    description: 'Receive alerts and system status updates',
                    required: false,
                  },
                ].map((permission) => (
                  <div
                    key={permission.key}
                    className={`p-6 rounded-xl border-2 transition-colors ${
                      formData.permissions[permission.key as keyof typeof formData.permissions]
                        ? 'bg-success-50 dark:bg-success-900/20 border-success-500'
                        : 'bg-gray-50 dark:bg-dark-800 border-gray-200 dark:border-dark-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="text-4xl">{permission.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {permission.title}
                            </h3>
                            {permission.required && (
                              <span className="badge-danger text-xs">Required</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => requestPermission(permission.key as any)}
                        disabled={
                          formData.permissions[permission.key as keyof typeof formData.permissions]
                        }
                        className={
                          formData.permissions[permission.key as keyof typeof formData.permissions]
                            ? 'btn-success'
                            : 'btn-primary'
                        }
                      >
                        {formData.permissions[
                          permission.key as keyof typeof formData.permissions
                        ] ? (
                          <>
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Granted
                          </>
                        ) : (
                          'Grant Access'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-glow animate-scale-in">
                {steps[4].icon}
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {steps[4].title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                {steps[4].description}
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-12">
                {[
                  {
                    icon: '👥',
                    label: 'Trusted Contacts',
                    value: formData.contacts.filter((c) => c.name).length,
                  },
                  {
                    icon: '⚙️',
                    label: 'Features Enabled',
                    value: Object.values(formData.preferences).filter(Boolean).length,
                  },
                  {
                    icon: '🔐',
                    label: 'Permissions',
                    value: Object.values(formData.permissions).filter(Boolean).length,
                  },
                ].map((stat, index) => (
                  <div key={index} className="p-6 bg-gray-50 dark:bg-dark-800 rounded-xl">
                    <div className="text-4xl mb-3">{stat.icon}</div>
                    <div className="text-3xl font-bold text-primary-600 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  💡 You can change these settings anytime from your dashboard
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            <button onClick={handleNext} className="btn-primary btn-lg">
              {currentStep === steps.length ? (
                <>
                  Go to Dashboard
                  <svg
                    className="w-5 h-5 ml-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </>
              ) : (
                <>
                  Continue
                  <svg
                    className="w-5 h-5 ml-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
