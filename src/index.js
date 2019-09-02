/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-19 21:38:49 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-09-02 21:08:06
 */

// import "./patcher";

import * as ReactDOM from "react-dom";
import * as React from "react";
import App from "./views/App";

ReactDOM.render(React.createElement(App, {}), document.getElementById("root"));
