import { idSet, useRows, type Row } from "./models";

/**
 * The choices of some parameters, read by their ids once the parameters are in: a control's
 * selections and the choices they offer, never the whole catalog's. `undefined` waits.
 */
export function useParameterChoices(
  parameters: readonly Pick<Row<"parameters">, "id">[] | undefined,
) {
  return useRows(
    "parameter_choices",
    { parameter_id: idSet(parameters?.map((parameter) => parameter.id)) },
    { columns: ["id", "parameter_id", "ordinal", "value"], enabled: parameters !== undefined },
  );
}
