import Image from "next/image";
import { RadioGroup, Switch } from "radix-ui";
import { Button } from "@/app/components/ui/button";
import { useEffect, useState } from "react";
import { toastAlert } from "@/lib/toast";
import { getWalletSettings, setWalletSettings } from "@/services/user";

type PriorityType = "low" | "medium" | "high" | "";

export default function WalletSettings() {
    const [priority, setPriority] = useState<PriorityType>("");

    const handleGasChange = (value: string) => {
      setPriority(value as PriorityType);
    }

    // }

    const getWalletSettingsData = async () => {
        try {
            let respData = await getWalletSettings();
            if(respData.success){
                setPriority(respData.result.priority);
            }
        } catch (error) {
            console.error("Error getting wallet settings:", error);
        }
    }

    useEffect(() => {
        getWalletSettingsData();
    }, []);

    const handleSaveChanges = async () => {
        try {
            let respData = await setWalletSettings({priority: priority});
            if(respData.success){
                toastAlert("success", "Changes saved successfully");
            }
        } catch (error) {
            console.error("Error saving changes:", error);
        }
    }

  return (
    <>
        <h1 className="sm:text-2xl text-xl font-bold sm:mb-8 sm:mt-0 mt-3 mb-4">Wallet Settings</h1>
        {console.log(priority,"priority")}
        <div className="sm:space-y-6 space-y-5 rounded-lg border bg-[#131212] sm:p-8 p-3">
            <div className="flex items-center space-x-3">
                <Image
                  src="/images/gas_icon.png"
                  alt="Icon"
                  width={30}
                  height={30}
                />
                <span className="sm:text-lg sm:text-[15px] font-semibold">
                  Pay your own gas
                </span>
              </div>

              <RadioGroup.Root
                className="RadioGroupRoot"
                defaultValue="default"
                aria-label="View density"
                value={priority}
                onValueChange={handleGasChange}
              >
                <div className="flex items-center justify-between">
                  <label className="Label sm:text-[15px] text-[14px]" htmlFor="r1">
                  Low priority fee    
                  {/* Low priority */}
                  </label>
                  <RadioGroup.Item
                    className="RadioGroupItem"
                    value="low"
                    id="r1"
                    checked={priority === "low"}
                  >
                    <RadioGroup.Indicator className="RadioGroupIndicator" />
                  </RadioGroup.Item>
                </div>
                <div className="flex items-center justify-between">
                  <label className="Label sm:text-[15px] text-[14px]" htmlFor="r2">
                    Medium priority fee
                    {/* Medium priority */}
                  </label>
                  <RadioGroup.Item
                    className="RadioGroupItem"
                    value="medium"
                    id="r2"
                    checked={priority === "medium"}
                  >
                    <RadioGroup.Indicator className="RadioGroupIndicator" />
                  </RadioGroup.Item>
                </div>
                <div className="flex items-center justify-between">
                  <label className="Label sm:text-[15px] text-[14px]" htmlFor="r3">
                    High priority
                    {/* High priority */}
                  </label>
                  <RadioGroup.Item
                    className="RadioGroupItem"
                    value="high"
                    id="r3"
                    checked={priority === "high"}
                  >
                    <RadioGroup.Indicator className="RadioGroupIndicator" />
                  </RadioGroup.Item>
                </div>
              </RadioGroup.Root>
              <div className="text-center">
                <Button
                  type="submit"
                  className="border border-white bg-transparent text-[12px] sm:text-[14px] text-white hover:bg-white hover:text-black transition-colors duration-300"
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </Button>
            </div>
        </div>
    </>
  );
}