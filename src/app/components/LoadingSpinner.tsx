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
      <h2 className="pb-10 text-xl text-amber-100">{message}</h2>
      <Oval
        visible={true}
        height="180"
        width="180"
        color="#b8712e"
        ariaLabel="oval-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
    </>
  );

  if (isFullScreen) {
    return (
      <div className="flex flex-col items-center align-center justify-baseline min-h-screen fixed top-10 left-0 right-0">
        <div className="p-10 rounded-lg shadow-lg text-center text-amber-100" style={{backgroundColor: '#3d2317'}}>
          {spinnerContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen" style={{backgroundColor: '#2d1810'}}>
      <Oval
        visible={true}
        height="80"
        width="80"
        color="#b8712e"
        ariaLabel="oval-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
    </div>
  );
};

export default LoadingSpinner;
