import React from "react";
import { Config } from "../types/marketplace-types";

import SnippetModal from "../components/Modals/Snippet";
import ReloadModal from "../components/Modals/Reload";
import SettingsModal from "../components/Modals/Settings";
import { CardProps } from "../components/Card/Card";

export type ModalType = "ADD_SNIPPET" | "EDIT_SNIPPET" | "VIEW_SNIPPET" | "RELOAD" | "SETTINGS";

const getModalSettings = (
  modalType: ModalType,
  CONFIG?: Config,
  updateAppConfig?: (CONFIG: Config) => void,
  props?: CardProps,
) => {
  switch (modalType) {
  case "ADD_SNIPPET":
    return {
      title: "Add Snippet",
      content: <SnippetModal type={modalType} />,
      isLarge: false,
    };
  case "EDIT_SNIPPET":
    return {
      title: "Edit Snippet",
      content: <SnippetModal type={modalType} content={props as CardProps} />,
      isLarge: false,
    };
  case "VIEW_SNIPPET":
    return {
      title: "View Snippet",
      content: <SnippetModal type={modalType} content={props as CardProps} />,
      isLarge: false,
    };
  case "RELOAD":
    return {
      title: "Reload",
      content: <ReloadModal />,
      isLarge: false,
    };
  case "SETTINGS":
    return {
      title: "Settings",
      // TODO: If I just use {CONFIG}, it nests it inside another object...
      content: <SettingsModal CONFIG={CONFIG as Config} updateAppConfig={updateAppConfig as (CONFIG: Config) => void} />,
      isLarge: true,
    };
  default:
    return {
      title: "",
      content: <div />,
      isLarge: false,
    };
  }
};

export const openModal = (
  modal: ModalType,
  CONFIG?: Config,
  updateAppConfig?: (CONFIG: Config) => void,
  props?: CardProps,
) => {
  const triggerModal = () => {
    const modalSettings = getModalSettings(modal, CONFIG, updateAppConfig, props);
    Spicetify.PopupModal.display(modalSettings);
  };

  triggerModal();
  return;
};
