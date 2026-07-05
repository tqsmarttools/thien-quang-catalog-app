window.CATALOG_STORAGE = {
  load(storageKey, fallbackState, getScreenFromHash) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return {
          ...fallbackState,
          currentScreen: getScreenFromHash()
        };
      }

      return {
        ...fallbackState,
        currentScreen: getScreenFromHash(),
        ...JSON.parse(raw)
      };
    } catch (error) {
      console.warn("Failed to load catalog state", error);
      return {
        ...fallbackState,
        currentScreen: getScreenFromHash()
      };
    }
  },

  save(storageKey, state) {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        currentScreen: state.currentScreen,
        selectedCategory: state.selectedCategory,
        selectedGroup: state.selectedGroup,
        isHomeGroupsExpanded: state.isHomeGroupsExpanded,
        activeFilter: state.activeFilter,
        draftFilter: state.draftFilter,
        isFilterOpen: state.isFilterOpen,
        isPreviewOpen: false,
        note: state.note,
        quote: state.quote
      })
    );
  }
};
