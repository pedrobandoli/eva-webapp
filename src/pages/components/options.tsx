import React, { useCallback, useState } from "react";
import "../../main.css";

const InputNumber = ({
  amount,
  handleSetOption,
}: {
  amount: number;
  handleSetOption: (type: "amount", v: number) => void;
}) => {
  const values = new Array(100).fill("_").map((_, i) => i + 1);
  return (
    <div className="input-wrapper">
      <span> Quantidade </span>
      <select
        onChange={(v) => handleSetOption("amount", parseInt(v.target.value))}
        value={amount}
      >
        {values.map((v) => (
          <option key={`_${v}`} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
};

const Checkbox = ({
  checked,
  handle,
  type,
}: {
  checked: boolean;
  handle: (type: "random" | "exact", v: boolean) => void;
  type: "random" | "exact";
}) => {
  console.log("Re-rendering children (Checkbox)");

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(v) => handle(type, v.target.checked)}
    />
  );
};

const Option = React.memo(
  ({
    title,
    value,
    handleSetOption,
    type,
  }: {
    value: boolean;
    title: string;
    handleSetOption: (type: "random" | "exact", v: any) => void;
    type: "random" | "exact";
  }) => {
    console.log("Re-rendering children (Option)");

    return (
      <div className="checkbox-wrapper">
        <span> {title} </span>
        <Checkbox checked={value} type={type} handle={handleSetOption} />
      </div>
    );
  }
);

export const Options = ({
  options,
  memoizedHandleSetOption,
}: {
  options: any;
  memoizedHandleSetOption: (type: 'amount' | 'random' | 'exact', v: any) => void;
}) => {
  console.log("Re-rendering parent");

  return (
    <div className="options">
      <Option
        title="Aleatório"
        value={options.random}
        handleSetOption={memoizedHandleSetOption}
        type="random"
      />
      <Option
        title="Exato"
        value={options.exact}
        handleSetOption={memoizedHandleSetOption}
        type="exact"
      />
      <InputNumber
        amount={options.amount}
        handleSetOption={memoizedHandleSetOption}
      />
    </div>
  );
};
