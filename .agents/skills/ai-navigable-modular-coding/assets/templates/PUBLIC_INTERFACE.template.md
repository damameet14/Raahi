# Public Interface Template

Adapt this pattern to the language and framework.

```text
Public operation:
  <descriptive_operation_name>

Accepts:
  <DescriptiveRequestContract>

Returns one of:
  <DescriptiveSuccessResult>
  <DescriptiveFailureResult>

May produce:
  <documented side effect or none>

Internal responsibilities hidden from callers:
  <internal workflow, persistence, integration, or rule>
```

External callers must import or call through the public interface rather than internal files.
