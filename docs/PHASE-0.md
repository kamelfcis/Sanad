unk;
            if (null !== chunk && "blocked" === chunk.status) {
              if (
                "object" === typeof blockedValue &&
                null !== blockedValue &&
                blockedValue.$$typeof === REACT_ELEMENT_TYPE
              ) {
                var erroredComponent = {
                  name: getComponentNameFromType(blockedValue.type) || "",
                  owner: blockedValue._owner
                };
                erroredComponent.debugStack = blockedValue._debugStack;
                supportsCreateTask &&
                  (erroredComponent.debugTask = blockedValue._debugTask);
                chunk._debugInfo.push(erroredComponent);
              }
              triggerErrorOnChunk(response, chunk, error);
            }
          }
        }
      );
      return null;
    }
    function resolveLazy(value) {
      for (
        ;
        "object" === typeof value &&
        null !== value &&
        value.$$typeof === REACT_LAZY_TYPE;

      ) {
        var payload = value._payload;
        if ("fulfilled" === payload.status) value = payload.value;
        else break;
      }
      return value;
    }
    function transferReferencedDebugInfo(parentChunk, referencedChunk) {
      if (null !== parentChunk) {
        referencedChunk = referencedChunk._debugInfo;
        parentChunk = parentChunk._debugInfo;
        for (var i = 0; i < referencedChunk.length; ++i) {
          var debugInfoEntry = referencedChunk[i];
          null == debugInfoEntry.name && parentChunk.push(debugInfoEntry);
        }
      }
    }
    function getOutlinedModel(response, reference, parentObject, key, map) {
      var path = reference.split(":");
      reference = parseInt(path[0], 16);
      reference = getChunk(response, reference);
      null !== initializingChunk &&
        isArrayImpl(initializingChunk._children) &&
        initializingChunk._children.push(reference);
      switch (reference.status) {
        case "resolved_model":
          initializeModelChunk(reference);
          break;
        case "resolved_module":
          initializeModuleChunk(reference);
      }
      switch (reference.status) {
        case "fulfilled":
          for (var value = reference.value, i = 1; i < path.length; i++) {
            for (
              ;
              "object" === typeof value &&
              null !== value &&
              value.$$typeof === REACT_LAZY_TYPE;

            ) {
              value = value._payload;
              switch (value.status) {
                case "resolved_model":
                  initializeModelChunk(value);
                  break;
                case "resolved_module":
                  initializeModuleChunk(value);
              }
              switch (value.status) {
                case "fulfilled":
                  value = value.value;
                  break;
                case "blocked":
                case "pending":
                  return waitForReference(
                    value,
           