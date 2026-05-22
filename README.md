# Setup Lefthook Action

A GitHub Action that downloads and sets up the latest [Lefthook](https://lefthook.dev/) on the runner.

## Usage

```yaml
- name: Setup Lefthook
  uses: threeal/setup-lefthook-action@v1.0.0
```

## Example

```yaml
- name: Setup Lefthook
  uses: threeal/setup-lefthook-action@v1.0.0

- name: Run pre-commit hooks
  run: lefthook run pre-commit --all-files
```

## License

This project is licensed under the [MIT License](LICENSE).

Copyright © 2026 [Alfi Maulana](https://github.com/threeal)
