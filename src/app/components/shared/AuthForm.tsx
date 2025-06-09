'use client';
import { useState } from 'react';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-6xl h-[500px] rounded-3xl bg-white shadow-2xl overflow-hidden relative">
        {/* Side Panel */}
        <div
          className={`absolute top-0 w-1/2 h-full rounded-3xl transition-all duration-1000 ease-in-out z-10 ${
            isLogin ? 'right-0 rounded-l-none' : 'left-0 rounded-r-none'
          }`}
          style={{
            background: 'linear-gradient(135deg, #ff3366 0%, #a855f7 100%)',
          }}
        >
          <div className="flex flex-col justify-center items-center h-full text-white p-12">
            <div
              className={`text-center transition-all duration-700 delay-300 ${
                isLogin
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
            >
              {isLogin && (
                <>
                  <h2 className="text-4xl font-bold mb-6 animate-pulse">
                    Welcome!
                  </h2>
                  <p className="text-lg mb-8 opacity-90 max-w-xs">
                    Enter your info to sign up
                  </p>
                  <button
                    onClick={() => setIsLogin(false)}
                    className="border-2 border-white rounded-full px-8 py-3 font-semibold hover:bg-white hover:text-purple-600 transition-all duration-500 hover:scale-110 hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    SIGN UP
                  </button>
                </>
              )}
            </div>

            <div
              className={`text-center transition-all duration-700 delay-300 ${
                !isLogin
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
            >
              {!isLogin && (
                <>
                  <h2 className="text-4xl font-bold mb-6 animate-pulse">
                    Welcome Back!
                  </h2>
                  <p className="text-lg mb-8 opacity-90 max-w-xs">
                    Please login to your account
                  </p>
                  <button
                    onClick={() => setIsLogin(true)}
                    className="border-2 border-white rounded-full px-8 py-3 font-semibold hover:bg-white hover:text-purple-600 transition-all duration-500 hover:scale-110 hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    SIGN IN
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex relative z-0">
          {/* Sign In Form */}
          <div
            className={`flex-1 p-12 flex flex-col justify-center transition-all duration-1000 ease-in-out ${
              isLogin ? 'opacity-100 translate-x-0' : 'opacity-50 -translate-x-8'
            }`}
          >
            <div className="max-w-sm mx-auto w-full">
              <div
                className={`transition-all duration-700 delay-500 ${
                  isLogin
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
              >
                <h2 className="text-3xl font-bold mb-2 text-gray-800">
                  Sign In
                </h2>
                <p className="text-gray-500 mb-8">
                  Enter your username and password
                </p>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Username"
                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-300 transform hover:scale-105 focus:scale-105 focus:shadow-lg"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-300 transform hover:scale-105 focus:scale-105 focus:shadow-lg"
                  />

                  <div className="text-center mt-6">
                    <button
                      type="button"
                      className="text-gray-500 text-sm hover:text-gray-700 transition-all duration-300 hover:scale-110 transform hover:-translate-y-0.5"
                    >
                      Forget Your Password?
                    </button>
                  </div>

                  <button
                    type="button"
                    className="w-full mt-8 rounded-lg py-3 text-white font-semibold transition-all duration-500 hover:opacity-90 hover:scale-105 hover:shadow-xl transform hover:-translate-y-1"
                    style={{ backgroundColor: '#ff3366' }}
                  >
                    SIGN IN
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Up Form */}
          <div
            className={`flex-1 p-12 flex flex-col justify-center transition-all duration-1000 ease-in-out ${
              !isLogin ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-8'
            }`}
          >
            <div className="max-w-sm mx-auto w-full">
              <div
                className={`transition-all duration-700 delay-500 ${
                  !isLogin
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
              >
                <h2 className="text-3xl font-bold mb-2 text-gray-800">
                  Create Account
                </h2>
                <p className="text-gray-500 mb-8">
                  Enter your username and passowrd
                </p>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Username"
                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-300 transform hover:scale-105 focus:scale-105 focus:shadow-lg"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-300 transform hover:scale-105 focus:scale-105 focus:shadow-lg"
                  />

                  <button
                    type="button"
                    className="w-full mt-8 rounded-lg py-3 text-white font-semibold transition-all duration-500 hover:opacity-90 hover:scale-105 hover:shadow-xl transform hover:-translate-y-1"
                    style={{ backgroundColor: '#f8326b' }}
                  >
                    SIGN UP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
