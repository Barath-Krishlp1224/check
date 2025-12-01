import React from "react";

const Page = () => {
  return (
    <div className="mt-20 px-6 text-gray-900">
      <h1 className="text-3xl font-bold text-indigo-600 mb-6">
        Page Loaded Successfully 🚀
      </h1>

      <p className="text-lg mb-4">
        Everything is working — this route is active and rendering correctly.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="p-5 border rounded-xl shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-1">Status</h2>
          <p>✔️ Connected</p>
        </div>

        <div className="p-5 border rounded-xl shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-1">Environment</h2>
          <p>NEXT.JS + React</p>
        </div>

        <div className="p-5 border rounded-xl shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-1">Component Mode</h2>
          <p>Client Component</p>
        </div>
      </div>

      <button className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
        Test Action Button
      </button>
    </div>
  );
};

export default Page;
