import React, { useState, useEffect } from 'react';
import { TestCaseResult } from '../types';
import { runAllTests } from '../services/testRunner';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Download,
  ShieldCheck,
  CheckSquare,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

export const AutomatedTestView: React.FC = () => {
  const [tests, setTests] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 25 });
  const [filter, setFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');

  const executeTestSuite = async () => {
    setIsRunning(true);
    setProgress({ current: 0, total: 25 });
    try {
      const results = await runAllTests((current, total) => {
        setProgress({ current, total });
      });
      setTests(results);
    } catch (err) {
      console.error('Test runner failure:', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    executeTestSuite();
  }, []);

  const passedCount = tests.filter((t) => t.status === 'PASS').length;
  const failedCount = tests.filter((t) => t.status === 'FAIL').length;

  const filteredTests = tests.filter((t) => {
    if (filter === 'PASS') return t.status === 'PASS';
    if (filter === 'FAIL') return t.status === 'FAIL';
    return true;
  });

  const handleDownloadReport = () => {
    const reportText = [
      '====================================================================',
      'CLOUD-BASED STUDENT ASSIGNMENT PORTAL - AUTOMATED TEST SUITE REPORT',
      `Execution Timestamp: ${new Date().toISOString()}`,
      `Total Tests: ${tests.length} | Passed: ${passedCount} | Failed: ${failedCount}`,
      '====================================================================\n',
      ...tests.map(
        (t) =>
          `[TEST #${t.id}] ${t.scenario}\n` +
          `Status: ${t.status}\n` +
          `Input: ${t.input}\n` +
          `Expected: ${t.expectedResult}\n` +
          `Actual: ${t.actualResult}\n` +
          '--------------------------------------------------------------------'
      )
    ].join('\n');

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cloud_Assignment_Test_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Sections 20 & 42 Requirements
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Target: 25 Cloud Verification Test Cases
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Automated Integration & Security Test Suite
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Validates student registration, RBAC boundaries, file validation, deadline algorithms, versioning, and failure resilience.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={executeTestSuite}
            disabled={isRunning}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? `Running (${progress.current}/${progress.total})...` : 'Re-run All Tests'}</span>
          </button>

          <button
            onClick={handleDownloadReport}
            disabled={tests.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Test Results Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Test Cases
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{tests.length}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Passed
          </span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{passedCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">
            Failed
          </span>
          <span className="text-2xl font-bold text-red-700 mt-1 block">{failedCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
            Pass Rate
          </span>
          <span className="text-2xl font-bold text-indigo-700 mt-1 block">
            {tests.length > 0 ? `${Math.round((passedCount / tests.length) * 100)}%` : '0%'}
          </span>
        </div>
      </div>

      {/* Progress bar during run */}
      {isRunning && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>Executing automated assertions...</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-150"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Test Cases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-900 text-sm">Specification Test Matrix</span>
          </div>

          <div className="flex space-x-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded font-medium transition ${
                filter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tests.length})
            </button>
            <button
              onClick={() => setFilter('PASS')}
              className={`px-3 py-1 rounded font-medium transition ${
                filter === 'PASS' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Passed ({passedCount})
            </button>
            <button
              onClick={() => setFilter('FAIL')}
              className={`px-3 py-1 rounded font-medium transition ${
                filter === 'FAIL' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Failed ({failedCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 w-16">Test ID</th>
                <th className="px-4 py-3 w-48">Scenario</th>
                <th className="px-4 py-3">Input</th>
                <th className="px-4 py-3">Expected Result</th>
                <th className="px-4 py-3">Actual Result</th>
                <th className="px-4 py-3 text-center w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    TC-{test.id.toString().padStart(2, '0')}
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-800">
                    {test.scenario}
                  </td>

                  <td className="px-4 py-3 text-slate-600 font-mono text-[11px] max-w-xs break-words">
                    {test.input}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {test.expectedResult}
                  </td>

                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {test.actualResult}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {test.status === 'PASS' ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>PASS</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span>FAIL</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
