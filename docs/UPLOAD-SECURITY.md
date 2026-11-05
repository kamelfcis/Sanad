s/jest/issues`
      );
    }
  }
  printFullResult(context, results) {
    const rootDir = context.config.rootDir;
    let testDir = results.testFilePath.replace(rootDir, '');
    testDir = testDir.slice(1, testDir.length);
    const resultTree = this.getResultTree(
      results.testResults,
      testDir,
      results.perfStats
    );
    this.printResultTree(resultTree);
  }
  arrayEqual(a1, a2) {
    if (a1.length !== a2.length) {
      return false;
    }
    for (let index = 0; index < a1.length; index++) {
      const element = a1[index];
      if (element !== a2[index]) {
        return false;
      }
    }
    return true;
  }
  arrayChild(a1, a2) {
    if (a1.length - a2.length !== 1) {
      return false;
    }
    for (let index = 0; index < a2.length; index++) {
      const element = a2[index];
      if (element !== a1[index]) {
        return false;
      }
    }
    return true;
  }
  getResultTree(suiteResult, testPath, suitePerf) {
    const root = {
      children: [],
      name: testPath,
      passed: true,
      performanceInfo: suitePerf
    };
    const branches = [];
    suiteResult.forEach(element => {
      if (element.ancestorTitles.length === 0) {
        if (element.status === 'failed') {
          root.passed = false;
        }
        const duration = element.duration || 1;
        root.children.push({
          children: [],
          duration,
          name: element.title,
          status: element.status
        });
      } else {
        let alreadyInserted = false;
        for (let index = 0; index < branches.length; index++) {
          if (
            this.arrayEqual(branches[index], element.ancestorTitles.slice(0, 1))
          ) {
            alreadyInserted = true;
            break;
          }
        }
        if (!alreadyInserted) {
          branches.push(element.ancestorTitles.slice(0, 1));
        }
      }
    });
    branches.forEach(element => {
      const newChild = this.getResultChildren(suiteResult, element);
      if (!newChild.passed) {
        root.passed = false;
      }
      root.children.push(newChild);
    });
    return root;
  }
  getResultChildren(suiteResult, ancestors) {
    const node = {
      children: [],
      name: ancestors[ancestors.length - 1],
      passed: true
    };
    const branches = [];
    suiteResult.forEach(element => {
      let duration = element.duration;
      if (!duration || isNaN(duration)) {
        duration = 1;
      }
      if (this.arrayEqual(element.ancestorTitles, ancestors)) {
        if (element.status === 'failed') {
          node.passed = false;
        }
        node.children.push({
          children: [],
          duration,
          name: element.title,
          status: element.status
        });
      } else if (
        this.arrayChild(
          element.ancestorTitles.slice(0, ancestors.length + 1),
          ancestors
        )
      ) {
        let alreadyInserted = false;
        for (let index = 0; index < branches.length; index++) {
          if (
            this.arrayEqual(
              branches[index],
              element.ancestorTitles.slice(0, ancestors.length + 1)
            )
          ) {
            alreadyInserted = true;
            break;
          }
        }
        if (!alreadyInserted) {
          branches.push(element.ancestorTitles.slice(0, ancestors.length + 1));
        }
      }
    });
    branche