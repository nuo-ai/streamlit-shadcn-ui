import {
  AtSignIcon,
  ClipboardIcon,
  DollarSignIcon,
  LinkIcon,
  MailIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { useId } from "react"

import type { V2RendererArgs } from "@/app"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRevisionedDraftState } from "@/protocol/reconciliation"
import type {
  InputGroupEnvelope,
  InputGroupIcon,
} from "@/protocol/schema"

type InputGroupViewProps = {
  envelope: InputGroupEnvelope
  setStateValue: V2RendererArgs["setStateValue"]
}

export type InputGroupControlProps = InputGroupViewProps & {
  controlId: string
  describedBy?: string
  invalid?: boolean
}

const ICONS = {
  "at-sign": AtSignIcon,
  "dollar-sign": DollarSignIcon,
  link: LinkIcon,
  mail: MailIcon,
  search: SearchIcon,
} satisfies Record<InputGroupIcon, typeof SearchIcon>

function AddonButton({
  children,
  disabled,
  label,
  onClick,
  onPointerDown,
}: {
  children: React.ReactNode
  disabled: boolean
  label: string
  onClick: () => void
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <InputGroupButton
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            onPointerDown={onPointerDown}
            size="icon-xs"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function InputGroupControl({
  controlId,
  describedBy,
  envelope,
  invalid = false,
  setStateValue,
}: InputGroupControlProps) {
  const { commit, commitDraft, draft, setDraft } =
    useRevisionedDraftState(envelope.state, setStateValue)
  const StartIcon = envelope.props.startIcon
    ? ICONS[envelope.props.startIcon]
    : null
  const hasStart = StartIcon !== null || envelope.props.prefix !== null
  const hasEnd =
    envelope.props.suffix !== null ||
    envelope.props.clearable ||
    envelope.props.copyable

  return (
    <InputGroup>
      <InputGroupInput
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        disabled={envelope.props.disabled}
        id={controlId}
        maxLength={envelope.props.maxLength ?? undefined}
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commitDraft()
          }
        }}
        placeholder={envelope.props.placeholder}
        type={envelope.props.type}
        value={draft}
      />
      {hasStart && (
        <InputGroupAddon align="inline-start">
          {StartIcon && <StartIcon aria-hidden="true" />}
          {envelope.props.prefix !== null && (
            <InputGroupText>{envelope.props.prefix}</InputGroupText>
          )}
        </InputGroupAddon>
      )}
      {hasEnd && (
        <InputGroupAddon align="inline-end">
          {envelope.props.suffix !== null && (
            <InputGroupText>{envelope.props.suffix}</InputGroupText>
          )}
          {envelope.props.clearable && (
            <AddonButton
              disabled={envelope.props.disabled || draft.length === 0}
              label="Clear value"
              onClick={() => {
                setDraft("")
                commit("")
              }}
              onPointerDown={(event) => {
                if (event.button === 0) event.preventDefault()
              }}
            >
              <XIcon aria-hidden="true" />
            </AddonButton>
          )}
          {envelope.props.copyable && (
            <AddonButton
              disabled={envelope.props.disabled || draft.length === 0}
              label="Copy value"
              onClick={() => {
                void navigator.clipboard?.writeText(draft)
              }}
              onPointerDown={(event) => {
                if (event.button === 0) event.preventDefault()
              }}
            >
              <ClipboardIcon aria-hidden="true" />
            </AddonButton>
          )}
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}

export function InputGroupView({
  envelope,
  setStateValue,
}: InputGroupViewProps) {
  const controlId = useId()
  return (
    <Field
      data-ssui-component="input-group"
      data-testid="ssui-v2-input-group"
    >
      <FieldLabel htmlFor={controlId}>{envelope.props.label}</FieldLabel>
      <InputGroupControl
        controlId={controlId}
        envelope={envelope}
        setStateValue={setStateValue}
      />
    </Field>
  )
}
