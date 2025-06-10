import React, { useState } from 'react';
import { FaUserCircle, FaEdit, FaTrash } from 'react-icons/fa';

const curriculumData = [
  {
    name: 'Curriculum for 2022',
    lastModified: 'May 19, 2025',
  },
  {
    name: 'Curriculum for 2019',
    lastModified: 'May 19, 2019',
  },
];

const CurriculumSetup: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredData = curriculumData.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-blue-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white rounded-xl shadow-md m-8 flex flex-col items-center py-8">
        <div className="flex flex-col items-center mb-8">
          <FaUserCircle className="text-6xl text-blue-400 mb-2" />
          <div className="text-center">
            <div className="font-bold">CHAIRPERSON</div>
            <div className="text-xs text-gray-500">Computer Science</div>
          </div>
        </div>
        <nav className="w-full px-6 mb-8">
          <div className="mb-4 text-xs text-gray-400 font-semibold">OVERVIEW</div>
          <ul className="space-y-2">
            <li className="font-medium text-blue-600">Curriculum</li>
            <li className="text-gray-600">Profile</li>
          </ul>
        </nav>
        <button className="mt-auto bg-green-100 text-green-700 px-4 py-2 rounded font-semibold hover:bg-green-200">Log Out</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col m-8 bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">Curriculum Setup</h1>
        <div className="flex items-center mb-6">
          <input
            type="text"
            placeholder="Search Curriculum"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 mr-4 w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button className="bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600">Create New Curriculum</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="py-3 px-4 font-semibold">Curriculum Name</th>
                <th className="py-3 px-4 font-semibold">Last Modified</th>
                <th className="py-3 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-blue-50">
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="py-3 px-4">{item.lastModified}</td>
                  <td className="py-3 px-4 flex space-x-4">
                    <button className="text-blue-500 hover:text-blue-700" title="Edit">
                      <FaEdit />
                    </button>
                    <button className="text-red-500 hover:text-red-700" title="Delete">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">No curriculums found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default CurriculumSetup;