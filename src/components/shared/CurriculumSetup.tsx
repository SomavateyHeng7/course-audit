import React, { useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

const curriculumData = [
  { name: 'Curriculum for 2022', lastModified: 'May 19, 2025' },
  { name: 'Curriculum for 2019', lastModified: 'May 19, 2019' },
];

const CurriculumSetup: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredData = curriculumData.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Curriculum Setup</h1>

      <div className="flex justify-between items-center mb-4">
        <div className="relative w-1/2 max-w-sm">
          <input
            type="text"
            placeholder="Search Curriculum"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <button className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 flex items-center space-x-2">
          <span>Create New Curriculum</span>
          <span>➕</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left py-3 px-4 font-semibold">Curriculum Name</th>
              <th className="text-left py-3 px-4 font-semibold">Last Modified</th>
              <th className="text-left py-3 px-4 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="py-3 px-4">{item.name}</td>
                <td className="py-3 px-4">{item.lastModified}</td>
                <td className="py-3 px-4 flex space-x-4">
                  <button className="text-gray-600 hover:text-blue-500" title="Edit">
                    <FaEdit />
                  </button>
                  <button className="text-gray-600 hover:text-red-500" title="Delete">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-400">
                  No curriculums found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurriculumSetup;
