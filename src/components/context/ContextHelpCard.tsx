'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BookOpen, Lightbulb, Target, HelpCircle, FileText, Download } from 'lucide-react';
import { downloadSampleContext, SAMPLE_TRAVEL_CONTEXT } from './sampleContext';

export function ContextHelpCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSample, setShowSample] = useState(false);

  return (
    <Card className="mb-6 border-indigo-200 bg-indigo-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <HelpCircle className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                How Context Management Works
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Learn how to configure Abilitix to answer questions in your company's voice
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="min-h-[44px]"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show Guide
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-6 pt-0">
          {/* What It Does */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">What It Does</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Context Management lets you control how Abilitix answers questions about your business. 
                  When enabled, Abilitix uses your Profile, Glossary, and Policy rules to provide answers 
                  that match your company's voice, terminology, and guidelines. General knowledge questions 
                  are unaffected—this only applies to questions about your business.
                </p>
              </div>
            </div>
          </div>

          {/* When to Use It */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">When to Use It</h3>
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                  <li>You want Abilitix to answer "What is your company?" or "What services do you offer?" using your brand voice</li>
                  <li>You have company-specific acronyms or terminology that need explanation (e.g., "RAG", "SME", "FAQ")</li>
                  <li>You need to enforce answer rules (e.g., "Always cite sources", "Never speculate on pricing")</li>
                  <li>You want to boost your company profile when users ask "about us" questions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Quick Tips</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-semibold">•</span>
                    <span><strong>Profile:</strong> Keep your value proposition concise (1-2 sentences). List your key offerings clearly.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-semibold">•</span>
                    <span><strong>Glossary:</strong> Focus on terms your customers might not know. Use simple, clear definitions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-semibold">•</span>
                    <span><strong>Policy:</strong> Be specific. "Always cite sources" is better than "be accurate".</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-semibold">•</span>
                    <span><strong>CSV Import:</strong> Use bulk import for glossaries with 10+ entries. Download the template first.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-semibold">•</span>
                    <span><strong>Preview:</strong> Test your context with sample queries before going live.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>1. Enable Context Bundle:</strong> Toggle the switch at the top to activate context management.
              </p>
              <p>
                <strong>2. Configure Sections:</strong> Fill in your Profile (who you are), Glossary (your terminology), 
                and Policy (answer rules). You can add entries manually or import via CSV.
              </p>
              <p>
                <strong>3. Preview & Test:</strong> Use the Preview panel on the right to test how your context affects 
                sample queries. Adjust as needed.
              </p>
              <p>
                <strong>4. Save:</strong> Click "Save Changes" when ready. Changes take effect within 60 seconds.
              </p>
            </div>
          </div>

          {/* Sample Configuration */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Sample Configuration</h3>
                  <p className="text-sm text-gray-700">
                    View a complete example for a Travel & Tourism company. This shows how to structure your Profile, 
                    Glossary, and Policy sections with real-world examples.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSampleContext()}
                className="min-h-[36px] border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSample(!showSample)}
              className="w-full text-sm text-purple-700 hover:text-purple-900 hover:bg-purple-100"
            >
              {showSample ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Sample
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  View Sample Configuration
                </>
              )}
            </Button>

            {showSample && (
              <div className="mt-4 bg-white rounded-lg p-4 border border-purple-200 max-h-96 overflow-y-auto">
                <div className="space-y-4 text-sm">
                  {/* Profile Sample */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Profile</h4>
                    <div className="space-y-2 text-gray-700">
                      <div>
                        <span className="font-medium">Value Proposition:</span>
                        <p className="text-xs mt-1 bg-gray-50 p-2 rounded">{SAMPLE_TRAVEL_CONTEXT.profile.value_prop}</p>
                      </div>
                      <div>
                        <span className="font-medium">Offerings:</span>
                        <ul className="text-xs mt-1 bg-gray-50 p-2 rounded list-disc list-inside">
                          {SAMPLE_TRAVEL_CONTEXT.profile.offerings.map((offering, i) => (
                            <li key={i}>{offering}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">Industry:</span>
                        <p className="text-xs mt-1 bg-gray-50 p-2 rounded">{SAMPLE_TRAVEL_CONTEXT.profile.industry}</p>
                      </div>
                      <div>
                        <span className="font-medium">Tone:</span>
                        <p className="text-xs mt-1 bg-gray-50 p-2 rounded">{SAMPLE_TRAVEL_CONTEXT.profile.tone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Glossary Sample */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Glossary ({SAMPLE_TRAVEL_CONTEXT.glossary.length} entries)</h4>
                    <div className="space-y-1 text-xs bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                      {SAMPLE_TRAVEL_CONTEXT.glossary.slice(0, 5).map((entry, i) => (
                        <div key={i} className="border-b border-gray-200 pb-1 last:border-0">
                          <span className="font-medium">{entry.term}:</span> {entry.meaning}
                        </div>
                      ))}
                      {SAMPLE_TRAVEL_CONTEXT.glossary.length > 5 && (
                        <p className="text-gray-500 italic">... and {SAMPLE_TRAVEL_CONTEXT.glossary.length - 5} more entries</p>
                      )}
                    </div>
                  </div>

                  {/* Policy Sample */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Policy Rules</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-green-700">Must ({SAMPLE_TRAVEL_CONTEXT.policy.must.length} rules):</span>
                        <ul className="text-xs mt-1 bg-green-50 p-2 rounded list-disc list-inside max-h-24 overflow-y-auto">
                          {SAMPLE_TRAVEL_CONTEXT.policy.must.slice(0, 3).map((rule, i) => (
                            <li key={i}>{rule}</li>
                          ))}
                          {SAMPLE_TRAVEL_CONTEXT.policy.must.length > 3 && (
                            <li className="text-gray-500 italic">... and {SAMPLE_TRAVEL_CONTEXT.policy.must.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-red-700">Never ({SAMPLE_TRAVEL_CONTEXT.policy.never.length} rules):</span>
                        <ul className="text-xs mt-1 bg-red-50 p-2 rounded list-disc list-inside max-h-24 overflow-y-auto">
                          {SAMPLE_TRAVEL_CONTEXT.policy.never.slice(0, 3).map((rule, i) => (
                            <li key={i}>{rule}</li>
                          ))}
                          {SAMPLE_TRAVEL_CONTEXT.policy.never.length > 3 && (
                            <li className="text-gray-500 italic">... and {SAMPLE_TRAVEL_CONTEXT.policy.never.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 italic pt-2 border-t border-gray-200">
                    This is a complete example for a Travel & Tourism company. Download the JSON file to see the full structure.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

