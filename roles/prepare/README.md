# Chained CI Prepare role

This role prepare the settings before getting artifacts and run the playbook.
It:
  - Warn if log level is HIGH to avoid data leaking
  - Check the step parameter is set
  - prepare the `config` fact
  - test `only` and `except` step parameters to limit when jobs are runned.
    This will __SKIP__ this job if __ONE of__ the `except` condition is
    successful __AND__ if __ALL__ the `only` conditions are failing. Those
    conditions are testing environment variables like this:
    - `VAR`: this test the presence of a variable that is not empty
    - `VAR == value`: this test the exact value of a variable
    - `VAR != value`: this test the exact difference of a variable.
    - `VAR in [value1, value2]`: this test the exact value of a variable is a
      set of possibilities

## Example

```
except:
  - "XXX in [aaa, aab]"
  - "YYY"
only:
  - "AAA == yes"
  - "BBB != no"
  - "CCC in [pitet, possible]"
```
