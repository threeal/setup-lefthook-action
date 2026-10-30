# Setup Lefthook Action

A GitHub Action that downloads and sets up [Lefthook](https://lefthook.dev/) on the runner.

## Usage

```yaml
- name: Setup Lefthook
  uses: threeal/setup-lefthook-action@v1.1.0
```

## Inputs

| Name      | Description                                                          |
| --------- | -------------------------------------------------------------------- |
| `version` | The Lefthook version to install, or `latest` for the newest release. |

If `version` is not set or is empty, the latest release is installed.

## Outputs

| Name      | Description                                 |
| --------- | ------------------------------------------- |
| `version` | The version of Lefthook that was installed. |

## Example

```yaml
- name: Setup Lefthook
  uses: threeal/setup-lefthook-action@v1.1.0
  with:
    version: 2.2.2

- name: Run pre-commit hooks
  run: lefthook run pre-commit --all-files
```

## License

This project is licensed under the [MIT License](LICENSE).

Copyright © 2026 [Alfi Maulana](https://github.com/threeal)
