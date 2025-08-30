import Image from "next/image";
import { Checkbox, Separator, Switch } from "radix-ui";
import { CheckIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { getUserData, setUserEmailNotification } from "@/services/user";
import { setInAppNotification } from "@/services/user";

export default function NotificationSettings() {
    const [emailNotification, setEmailNotification] = useState(false);
    const [orderFill, setOrderFill] = useState(false)

    const handleEmailNotificationToggle = async (enabled) => {
        try {
          let respData = await setUserEmailNotification({status: enabled});
          if(respData.success){
            setEmailNotification(enabled);
          }
        } catch (error) {
          console.error("Error updating email notification:", error);
        }
    }

    const handleOrderFillToggle = async (enabled) => {
        try {
          let respData = await setInAppNotification({status: enabled});
          if(respData.success){
            setOrderFill(enabled);
          }
        } catch (error) {
          console.error("Error updating email notification:", error);
        }
    }

    const getNotificationSettings = async() => {
        try{
            let { success,result } = await getUserData()
            if(success){
                if(result?.notification?.email?.includes('resolution')){
                    setEmailNotification(true)
                }else {
                    setEmailNotification(false)
                }

                if(result?.notification?.inApp?.includes('fillOrder')){
                    setOrderFill(true)
                }else {
                    setOrderFill(false)
                }
            }
        } catch(err){
            console.log("error: ",err)
        }
    }

    useEffect(()=>{
        getNotificationSettings()
    },[])

    return (
        <>
            <h1 className="sm:text-2xl text-xl font-bold sm:mb-8 sm:mt-0 mt-3 mb-4">Notification Settings</h1>
            <div className="sm:space-y-6 space-y-3 pt-6 pb-6 rounded-lg border bg-[#131212] sm:p-8 p-3">
            <div className="flex items-center space-x-3">
                <Image
                src="/images/email_icon.png"
                alt="Icon"
                width={30}
                height={30}
                />
                <span className="sm:text-lg text-[15px] font-semibold">Email</span>
            </div>
            <div className="flex items-center sm:text-[15px] text-[14px] justify-between">
                <label
                    className="Label"
                    htmlFor="airplane-mode"
                    style={{ paddingRight: 15 }}
                >
                Resolutions
                </label>
                <Switch.Root
                    className="SwitchRoot"
                    id="airplane-mode"
                    checked={emailNotification}
                    onCheckedChange={handleEmailNotificationToggle}
                >
                <Switch.Thumb className="SwitchThumb" />
                </Switch.Root>
            </div>
            <Separator.Root
                className="SeparatorRoot"
                style={{ margin: "15px 0" }}
            />
            <div className="flex items-center space-x-3">
                <Image
                src="/images/bell_icon.png"
                alt="Icon"
                width={30}
                height={30}
                />
                <span className="sm:text-lg text-[15px] font-semibold">In App</span>
            </div>
            <div className="flex items-center sm:text-[15px] text-[14px] justify-between">
                <label
                className="Label"
                htmlFor="airplane-mode"
                style={{ paddingRight: 15 }}
                > 
                Order Fills
                </label>
                <Switch.Root 
                className="SwitchRoot"
                id="airplane-mode"
                checked={orderFill}
                onCheckedChange={handleOrderFillToggle}
                >
                <Switch.Thumb className="SwitchThumb" />
                </Switch.Root>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox.Root
                className="CheckboxRoot"
                defaultChecked
                id="c1"
                >
                <Checkbox.Indicator className="CheckboxIndicator">
                    <CheckIcon className="h-[20px] w-[20px]" />
                </Checkbox.Indicator>
                </Checkbox.Root>
                <label className="Label sm:text-[15px] text-[14px]" htmlFor="c1">
                Hide small fills (Less than 1 share)
                </label>
            </div>
            </div>
        </>
    );
}