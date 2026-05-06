import { ViteSSG } from "vite-ssg/single-page";
import App from "./App";
import "./styles/tailwind.css";

export const createApp = ViteSSG(App);
