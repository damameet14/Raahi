# Small Project Example

A small command-line file-renaming utility does not need enterprise module folders.

Good structure:

```text
file_renaming_utility/
├── main.py
├── rename_files_using_pattern.py
├── file_renaming_contracts.py
└── tests/
    └── test_rename_files_using_pattern.py
```

The same principles still apply:

- `main.py` parses command-line input and delegates;
- `rename_files_using_pattern.py` owns the operation;
- contracts describe requested renaming and results;
- filesystem access is explicit;
- names use complete words;
- no generic `utils.py` is created.

If the entire correct implementation is one cohesive file, keep one file and use descriptive functions. Modularity is not measured by file count.
