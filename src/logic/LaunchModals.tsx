import React from "react";
import { Config } from "../types/marketplace-types";

import AddSnippetModal from "../components/Modals/AddSnippet";
import ReloadModal from "../components/Modals/Reload";
import SettingsModal from "../components/Modals/Settings";

type ModalType = "ADD_SNIPPET" | "RELOAD" | "SETTINGS";

const getModalSettings = (
  modalType: ModalType,
  CONFIG?: Config,
  updateAppConfig?: (CONFIG: Config) => void,
) => {
  switch (modalType) {
  case "ADD_SNIPPET":
    return {
      title: "Add Snippet",
      content: <AddSnippetModal />,
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
) => {
  const triggerModal = () => {
    const modalSettings = getModalSettings(modal, CONFIG, updateAppConfig);
    Spicetify.PopupModal.display(modalSettings);
  };

  triggerModal();
  return;
};
