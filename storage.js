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
        ...JSON.parse(raw),
        // A shared link should always open the screen requested in its URL.
        currentScreen: getScreenFromHash()
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
