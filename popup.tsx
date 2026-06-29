import "~style.css"
import { TabPickerView } from "~components/TabPickerView"

function IndexPopup() {
    return (
        <div className="w-[480px] bg-[#111111] text-white">
            <TabPickerView />
        </div>
    );
}

export default IndexPopup;