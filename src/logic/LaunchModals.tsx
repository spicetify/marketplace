import React from "react";
import { t } from "i18next";
import { Config } from "../types/marketplace-types";

import SnippetModal from "../components/Modals/Snippet";
import ReloadModal from "../components/Modals/Reload";
import SettingsModal from "../components/Modals/Settings";
import ThemeDevToolsModal from "../components/Modals/ThemeDevTools";
import BackupModal from "../components/Modals/BackupModal";
import UpdateModal from "../components/Modals/Update";
import { CardProps } from "../components/Card/Card";

export type ModalType = "ADD_SNIPPET" | "EDIT_SNIPPET" | "VIEW_SNIPPET" | "RELOAD" | "SETTINGS" | "THEME_DEV_TOOLS" | "BACKUP" | "UPDATE";

const getModalSettings = (
  modalType: ModalType,
  CONFIG?: Config,
  updateAppConfig?: (CONFIG: Config) => void,
  props?: CardProps,
  callback?: () => void,
) => {
  switch (modalType) {
  case "ADD_SNIPPET":
    return {
      title: t("snippets.addTitle"),
      content: <SnippetModal type={modalType} />,
      isLarge: true,
    };
  case "EDIT_SNIPPET":
    return {
      title: t("snippets.editTitle"),
      content: <SnippetModal type={modalType} content={props as CardProps} />,
      isLarge: true,
    };
  case "VIEW_SNIPPET":
    return {
      title: t("snippets.viewTitle"),
      content: <SnippetModal type={modalType} content={props as CardProps} callback={callback} />,
      isLarge: true,
    };
  case "RELOAD":
    return {
      title: t("reloadModal.title"),
      content: <ReloadModal />,
      isLarge: false,
    };
  case "SETTINGS":
    return {
      title: t("settings.title"),
      // TODO: If I just use {CONFIG}, it nests it inside another object...
      content: <SettingsModal CONFIG={CONFIG as Config} updateAppConfig={updateAppConfig as (CONFIG: Config) => void} />,
      isLarge: true,
    };
  case "THEME_DEV_TOOLS":
    return {
      title: t("devTools.title"),
      content: <ThemeDevToolsModal />,
      isLarge: true,
    };
  case "BACKUP":
    return {
      title: t("backupModal.title"),
      content: <BackupModal />,
      isLarge: true,
    };
  case "UPDATE":
    return {
      title: t("updateModal.title"),
      content: <UpdateModal />,
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
  callback?: () => void,
) => {
  const triggerModal = () => {
    const modalSettings = getModalSettings(modal, CONFIG, updateAppConfig, props, callback);
    Spicetify.PopupModal.display(modalSettings);
  };

  triggerModal();
  return;
};

