# Setup Lefthook Action

A GitHub Action that downloads and sets up [Lefthook](https://lefthook.dev/) on the runner.

## Usage

```yaml
- name: Setup Lefthook
  uses: threeal/setup-lefthook-action@v1.0.0
```

## Inputs

| Name      | Description                         | Default        |
| --------- | ----------------------------------- | -------------- |
| `version` | The version of Lefthook to install. | Latest version |

## Outputs

| Name      | Description                                 |
| --------- | ------------------------------------------- |
| `version` | The version of Lefthook that was installed. |

## Example

```yaml
- name: Setup Lefthook
  uses: threeal/setup-lefthook-action@v1.0.0
  with:
    version: 2.1.0

- name: Run pre-commit hooks
  run: lefthook run pre-commit --all-files
```

## License

This project is licensed under the [MIT License](LICENSE).

Copyright © 2026 [Alfi Maulana](https://github.com/threeal)
