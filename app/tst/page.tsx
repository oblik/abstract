"use client";
import React from "react";
import EventListing from "../components/customComponents/EventListing";

const Tst = () => {
  return (
    <div>
      <EventListing selectedSubcategory={"all"} selectCategory={"music"} showClosed={false}/>
    </div>
  );
};

export default Tst;
