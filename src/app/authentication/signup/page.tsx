import React from 'react';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2d3e50]">
      <div className="bg-[#d0e6ff] rounded-md shadow-md w-[90%] max-w-5xl flex overflow-hidden border border-blue-400">
        
        <div className="w-1/2 bg-[#c2d6f8] flex flex-col items-center justify-center p-10">
          <div>
            <img
              src="/image/logo.png"
              alt="Scholarithm Logo"
              className="h-40 w-40 object-contain"
            />
          </div>
          <h1 className="text-lg font-mono font-bold text-[#2d3e50] mt-4">SCHOLARITHM</h1>
        </div>

        <div className="w-1/2 bg-white rounded-r-lg p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-[#2d3e50] mb-6 text-center">Register</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full px-4 py-2 border rounded focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 border rounded focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-2 border rounded focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                className="w-full px-4 py-2 border rounded focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-[#2d2e5f] text-white rounded hover:bg-[#1f1f3d] transition"
            >
              Register
            </button>
            <p className="text-center text-sm text-gray-600 mt-2">
              Already Have An Account?{" "}
              <a href="/login" className="text-[#2d2e5f] font-semibold hover:underline">
                Sign In
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
