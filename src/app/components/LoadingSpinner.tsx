"use client";
import { Oval } from "react-loader-spinner";
import React from "react";

interface LoadingSpinnerProps {
  isFullScreen?: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isFullScreen = false, message = "Loading" }) => {
  const spinnerContent = (
    <>
      <h2 className="pb-10 text-xl">{message}</h2>
      <Oval
        visible={true}
        height="180"
        width="180"
        color="#D4A574"
        secondaryColor="#2B2C2D"
        ariaLabel="oval-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
    </>
  );

  if (isFullScreen) {
    return (
      <div className="flex flex-col items-center align-center justify-baseline min-h-screen fixed top-10 left-0 right-0">
        <div className="bg-gray-600 p-10 rounded-lg shadow-lg text-center">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-darker">
      <Oval
        visible={true}
        height="80"
        width="80"
        color="#D4A574"
        secondaryColor="#2B2C2D"
        ariaLabel="oval-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
    </div>
  );
};

export default LoadingSpinner;
