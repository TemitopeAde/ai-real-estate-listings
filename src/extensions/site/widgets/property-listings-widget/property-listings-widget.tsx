import React from "react";
import ReactDOM from "react-dom";
import reactToWebComponent from "react-to-webcomponent";
import { SubscribedWidget } from "./property-listings-widget.view";

export default reactToWebComponent(SubscribedWidget, React, ReactDOM, { props: { config: "string" } });
