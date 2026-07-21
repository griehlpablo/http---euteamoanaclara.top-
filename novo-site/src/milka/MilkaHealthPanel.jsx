import MilkaFeedingCard from "./MilkaFeedingCard";
import MilkaRecordCard from "./MilkaRecordCard";
import MilkaWeightCard from "./MilkaWeightCard";

export default function MilkaHealthPanel(props) {
  return (
    <>
      <section className="grid gap-6 lg:grid-cols-2">
        <MilkaWeightCard profile={props.profile} person={props.person} saving={props.saving} onSave={props.onSaveWeight} />
        <MilkaRecordCard person={props.person} saving={props.saving} onSave={props.onSaveRecord} />
      </section>
      <MilkaFeedingCard profile={props.profile} />
    </>
  );
}
