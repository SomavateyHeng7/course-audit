import React, { useState } from 'react';

export default function Login() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2d3e50]">
      <div className="bg-[#d0e6ff] rounded-md shadow-md w-[90%] max-w-5xl flex overflow-hidden border border-blue-400">

        {/* Left Panel */}
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

        {/* Right Panel */}
        <div className="w-1/2 bg-white rounded-r-lg p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-[#2d2e5f] mb-6 text-center">Log in to your account</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 border rounded focus:outline-none"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="text-sm text-gray-600">Password</label>
                <a href="#" className="text-sm text-[#2d2e5f] hover:underline">Forgot Password?</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 border rounded pr-10 focus:outline-none"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2.5 text-gray-500 text-sm"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#2d2e5f] text-white rounded hover:bg-[#1f1f3d] transition"
            >
              Log in
            </button>

            <p className="text-center text-sm text-gray-600 mt-2">
              Don’t Have An Account?{" "}
              <a href="/register" className="text-[#2d2e5f] font-semibold hover:underline">Sign Up</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
