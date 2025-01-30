import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CgTrash } from "react-icons/cg";
import { HiRefresh } from "react-icons/hi";
import { FiClipboard } from "react-icons/fi";
import { MdDone } from "react-icons/md";
import Swal from "sweetalert2/dist/sweetalert2.js";
import { isNull } from "lodash";

const SharedLinks = () => {
  const [sharedLinks, setSharedLinks] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [buttonStates, setButtonStates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const itemsPerPage = 8;
  const baseUrl = window.location.origin;

  const buttonColors = [
    "bg-indigo-400",
    "bg-teal-400",
    "bg-yellow-400",
    "bg-red-400",
    "bg-purple-400",
    "bg-lime-400",
    "bg-green-400",
    "bg-pink-400",
    "bg-orange-400",
    "bg-blue-400",
  ];

  const fetchSharedLinks = async () => {
    try {
      const token = localStorage.getItem("token");
      const isLogin = localStorage.getItem("login");

      if (!token || !isLogin) {
        sessionStorage.removeItem("sharedLinks");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/api/user/sharedLinks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.sharedLinks && Array.isArray(data.sharedLinks)) {
        const reversedLinks = data.sharedLinks.reverse();
        sessionStorage.setItem("sharedLinks", JSON.stringify(reversedLinks));
        setSharedLinks(reversedLinks);
      }
    } catch {
      Swal.fire("Error", "Error fetching shared links.", "error");
    }
  };

  const handleDelete = async (shareId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this action!",
      icon: "warning",
      reverseButtons: true,
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#da4242",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Deleting...",
          text: "Please wait while your code is being deleted.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const linkResponse = await fetch(
          `${
            import.meta.env.VITE_BACKEND_API_URL
          }/api/user/sharedLink/${shareId}`,
          {
            method: "DELETE",
          }
        );

        const fileResponse = await fetch(
          `${import.meta.env.VITE_TEMP_SHARE_URL}/file/${shareId}/delete`,
          {
            method: "DELETE",
          }
        );

        if (!fileResponse.ok && !linkResponse.ok) {
          Swal.close();
          Swal.fire("Error", "There was an issue deleting the link.", "error");

          sessionStorage.removeItem("sharedLinks");
          return;
        }

        if (fileResponse.ok || linkResponse.ok) {
          Swal.close();
          Swal.fire("Deleted!", "The link has been deleted.", "success");

          setSharedLinks((prevLinks) =>
            prevLinks.filter((link) => link.shareId !== shareId)
          );
        } else {
          Swal.close();
          Swal.fire("Error", "Failed to delete link. Refresh and try again.", "error");
        }

        sessionStorage.removeItem("sharedLinks");
      }
    });
  };

  const handleCopy = async (shareId) => {
    const url = `${baseUrl}/${shareId}`;
    await navigator.clipboard.writeText(url);

    if (buttonStates[shareId]?.timeout) {
      clearTimeout(buttonStates[shareId].timeout);
    }

    setButtonStates((prev) => ({
      ...prev,
      [shareId]: { text: "Copied", icon: <MdDone />, timeout: null },
    }));

    const timeout = setTimeout(() => {
      setButtonStates((prev) => ({
        ...prev,
        [shareId]: { text: "Copy", icon: <FiClipboard /> },
      }));
    }, 1500);

    setButtonStates((prev) => ({
      ...prev,
      [shareId]: { ...prev[shareId], timeout },
    }));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    sessionStorage.removeItem("sharedLinks");
    fetchSharedLinks();

    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleNext = () => {
    setCurrentPage((prev) =>
      Math.min(prev + 1, Math.ceil(sharedLinks.length / itemsPerPage))
    );
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  useEffect(() => {
    const isLogin = localStorage.getItem("login");

    if (!isLogin) {
      sessionStorage.removeItem("sharedLinks");
      return;
    }

    const username = localStorage.getItem("username");
    if (username) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }

    if(!isLoggedIn){
      return;
    }
  
    const sharedLink = sessionStorage.getItem("sharedLinks");
    if (isNull(sharedLink) || sharedLink === "[]") {
      fetchSharedLinks();
    } else {
      setSharedLinks(JSON.parse(sharedLink));
    }
  }, [isLoggedIn]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleLinks = sharedLinks.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex justify-center px-12 pb-12 motion-delay-[1400ms] motion-preset-rebound-down">
      <div className="w-full max-w-screen-lg">
        <div className="mb-6">
          {isLoggedIn && visibleLinks.length > 0 && (
            <div className="flex items-center">
              <h2 className="text-2xl font-bold mb-4 text-left mr-4 underline underline-offset-2 decoration-4 decoration-blue-500 hover:decoration-blue-400 dark:decoration-blue-600 dark:hover:decoration-blue-700">
                Shared Links
              </h2>
              <button
                onClick={handleRefresh}
                title="refresh"
                className={`bg-blue-500 text-white px-2 py-2 rounded-full mb-4 transform transition duration-200 ease-in-out cursor-pointer hover:bg-blue-600 hover:scale-95 focus:outline-none ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              >
                <HiRefresh />
              </button>
            </div>
          )}

          {isLoggedIn && visibleLinks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
              {visibleLinks.map(({ title, shareId }, index) => {
                const colorClass = buttonColors[index % buttonColors.length];
                return (
                  <div key={index} className="relative w-full">
                    <div className="flex justify-between items-center w-full">
                      <Link
                        to={`${baseUrl}/${shareId}`}
                        aria-label={title}
                        title={title}
                        className={`w-full px-8 py-4 text-xl font-semibold ${colorClass} text-white text-center rounded-lg shadow-lg whitespace-nowrap overflow-hidden text-ellipsis hover:scale-105 transform transition-all duration-300 sm:px-6 sm:py-3 sm:text-lg md:px-8 md:py-4 lg:px-8 lg:py-4`}
                      >
                        {title
                          ? `${title.charAt(0).toUpperCase()}${
                              title.length > 30
                                ? title.slice(1, 30) + "..." + title.slice(-3)
                                : title.slice(1)
                            }`
                          : "Untitled"}
                      </Link>
                      <div className="flex flex-col items-center ml-2 w-10 space-y-0.5">
                        <button
                          onClick={() => handleCopy(shareId)}
                          title="Copy link"
                          className="w-full py-1.5 text-white bg-green-500 hover:bg-green-700 rounded-lg focus:outline-none transform transition duration-200 ease-in-out hover:scale-105"
                        >
                          {buttonStates[shareId]?.text === "Copied" ? (
                            <MdDone className="mx-auto" />
                          ) : (
                            <FiClipboard className="mx-auto" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(shareId)}
                          title="Delete"
                          className="w-full py-1.5 text-white bg-red-500 hover:bg-red-700 rounded-lg focus:outline-none transform transition duration-200 ease-in-out hover:scale-105"
                        >
                          <CgTrash className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isLoggedIn && sharedLinks.length > 8 && (
            <div className="flex justify-between mt-6">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg transform transition duration-200 ease-in-out hover:scale-105"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentPage * itemsPerPage >= sharedLinks.length}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg transform transition duration-200 ease-in-out hover:scale-105"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedLinks;
