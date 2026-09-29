import React, { useState, useEffect } from 'react';
import { StorageObject } from '../types';
import { cloudStorage } from '../services/storageService';
import {
  HardDrive,
  Folder,
  FileText,
  Download,
  Database,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';

export const StorageExplorer: React.FC = () => {
  const [objects, setObjects] = useState<StorageObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedObject, setSelectedObject] = useState<StorageObject | null>(null);

  const fetchStorageObjects = async () => {
    setLoading(true);
    try {
      const list = await cloudStorage.listAllObjects();
      list.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      setObjects(list);
      if (list.length > 0 && !selectedObject) {
        setSelectedObject(list[0]);
      }
    } catch (err) {
      console.error('Failed to list storage objects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageObjects();
  }, []);

  const filtered = objects.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.path.toLowerCase().includes(search.toLowerCase())
  );

  const totalBytes = objects.reduce((acc, obj) => acc + obj.size, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Cloud Object Storage Inspector
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Bucket: <span className="text-slate-800 font-semibold">gs://student-assignments-store</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Binary Object Storage Bucket</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Demonstrates why large assignment files are separated from Firestore / SQL databases into structured cloud bucket paths.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block">Total Stored Binary:</span>
            <span className="font-bold text-slate-900 text-sm">
              {(totalBytes / 1024).toFixed(1)} KB ({objects.length} files)
            </span>
          </div>
          <button
            onClick={fetchStorageObjects}
            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
            title="Refresh Bucket"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cloud Architecture Lesson Callout */}
      <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs space-y-2 border border-slate-800">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold">
          <Server className="w-4 h-4" />
          <span>Storage Architecture Pattern: Decoupled Binary Storage</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          In cloud engineering, databases (Firestore, PostgreSQL, DynamoDB) store <strong>structured metadata</strong> (timestamps, status, marks, IDs) which are optimized for rapid indexes and sub-10ms queries. Large binary payloads (PDFs, DOCX, ZIPs) are streamed into <strong>Cloud Object Storage</strong> (S3, Cloud Storage) which offers infinite scalability, high availability (99.999999999% durability), and lower cost per gigabyte.
        </p>
      </div>

      {/* Main Grid: Storage Hierarchy Table & Object Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of Objects */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search storage paths or files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing {filtered.length} of {objects.length} objects
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Querying Storage Bucket...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <Folder className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Storage bucket is empty</p>
              <p className="text-slate-400 mt-1">Submit an assignment from the student dashboard to populate.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="px-4 py-3">File Name</th>
                    <th className="px-4 py-3">Storage Path (Bucket URI)</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filtered.map((obj) => (
                    <tr
                      key={obj.path}
                      onClick={() => setSelectedObject(obj)}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        selectedObject?.path === obj.path ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-sans font-medium text-slate-900 flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate max-w-[140px]">{obj.name}</span>
                      </td>

                      <td className="px-4 py-3 text-slate-500 truncate max-w-xs" title={obj.path}>
                        {obj.path}
                      </td>

                      <td className="px-4 py-3 text-slate-700 font-sans">
                        {(obj.size / 1024).toFixed(1)} KB
                      </td>

                      <td className="px-4 py-3 text-slate-400 font-sans text-[10px]">
                        {new Date(obj.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="px-4 py-3 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cloudStorage.downloadObject(obj.dataUrl, obj.name);
                          }}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                          title="Download Blob"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Object Metadata Inspector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Object Properties</span>
            </h3>
            {selectedObject && (
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                200 OK
              </span>
            )}
          </div>

          {selectedObject ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block">Object Name:</span>
                <span className="font-bold text-slate-900 break-all">{selectedObject.name}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Canonical URI:</span>
                <span className="font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200 block text-slate-800 break-all">
                  gs://student-assignments-store/{selectedObject.path}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Content-Type:</span>
                  <span className="font-mono text-[11px] text-slate-800">{selectedObject.mimeType}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Payload Size:</span>
                  <span className="font-semibold text-slate-800">{selectedObject.size} bytes</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Server Upload Timestamp:</span>
                <span className="text-slate-800">{new Date(selectedObject.uploadedAt).toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 block">Decoded Metadata:</span>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[10px] space-y-1 text-slate-600">
                  <div>studentId: "{selectedObject.metadata.studentId}"</div>
                  <div>courseId: "{selectedObject.metadata.courseId}"</div>
                  <div>assignmentId: "{selectedObject.metadata.assignmentId}"</div>
                  <div>version: {selectedObject.metadata.version}</div>
                </div>
              </div>

              <button
                onClick={() => cloudStorage.downloadObject(selectedObject.dataUrl, selectedObject.name)}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Object Binary</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Select an object from the list to inspect headers.</p>
          )}
        </div>
      </div>
    </div>
  );
};
