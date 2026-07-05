import { useEffect } from "react"
import "~style.css"
import { TabPickerView } from "~components/TabPickerView"

function IndexPopup() {
    useEffect(() => {
        const theme = localStorage.getItem("tabkeep-theme") || "dark";
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    return (
        <div className="w-[480px] bg-[#f5f5f7] dark:bg-[#171717] text-gray-900 dark:text-white min-h-[100vh]">
            <TabPickerView />
        </div>
    );
}

export default IndexPopup;